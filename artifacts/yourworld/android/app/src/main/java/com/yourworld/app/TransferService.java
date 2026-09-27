package com.yourworld.app;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.*;
import android.util.Base64;
import android.webkit.MimeTypeMap;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class TransferService extends Service {
    public static final String ACTION_UPLOAD = "com.yourworld.UPLOAD";
    public static final String ACTION_DOWNLOAD = "com.yourworld.DOWNLOAD";
    private static final String ACTION_PROGRESS = "com.yourworld.TRANSFER_PROGRESS";
    private static final int NOTIFICATION_ID = 4107;
    private static final long CHUNK = 5L * 1024 * 1024;
    private ExecutorService tasks;
    private final Map<String, Future<?>> running = new ConcurrentHashMap<>();
    private final Map<String, Long> startedAt = new ConcurrentHashMap<>();
    private final Map<String, Long> startedBytes = new ConcurrentHashMap<>();
    private final Map<String, ArrayDeque<Sample>> samples = new ConcurrentHashMap<>();
    private android.os.PowerManager.WakeLock wakeLock;
    private static final int CONNECT_TIMEOUT_MS = 20_000;
    private static final int READ_TIMEOUT_MS = 60_000;

    @Override public void onCreate() {
        super.onCreate(); createChannel();
        tasks = Executors.newFixedThreadPool(2);
        android.os.PowerManager pm = (android.os.PowerManager)getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "YourWorld:transfers");
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;
        startForeground(NOTIFICATION_ID, notification("Transfers active"));
        {
            String id = intent.getStringExtra("id");
            if (id != null && !running.containsKey(id)) {
                startedAt.put(id, System.currentTimeMillis()); startedBytes.put(id, 0L);
                Future<?> f = tasks.submit(() -> {
                    try { wakeLock.acquire(10 * 60 * 60 * 1000L); if (ACTION_UPLOAD.equals(intent.getAction())) upload(intent); else download(intent); }
                    catch (Exception e) { progress(id, ACTION_UPLOAD.equals(intent.getAction()) ? "upload" : "download", "error", 0, 0, 0, e.toString(), null, null, null); }
                    finally { if (wakeLock.isHeld()) wakeLock.release(); running.remove(id); startedAt.remove(id); startedBytes.remove(id); samples.remove(id); if (running.isEmpty()) stopForeground(STOP_FOREGROUND_REMOVE); }
                });
                running.put(id, f);
            }
        }
        // Credentials and source URLs are intentionally memory-only. A killed
        // process cannot safely reconstruct an authenticated transfer.
        return START_NOT_STICKY;
    }
    @Override public IBinder onBind(Intent intent) { return null; }

    private void upload(Intent i) throws Exception {
        String id=safe(i.getStringExtra("id")), endpoint=i.getStringExtra("endpoint"), token=i.getStringExtra("token");
        File source=findStagingFile(this,id); if(source==null) throw new IOException("Upload staging file not found");
        long total=source.length(), offset=readOffset(id); String location=readLocation(id);
        if(location==null) {
            HttpURLConnection c=(HttpURLConnection)new URL(endpoint).openConnection(); timeouts(c); c.setRequestMethod("POST"); headers(c,i,token);
            c.setDoOutput(true); c.setFixedLengthStreamingMode(0); c.setRequestProperty("Upload-Length",String.valueOf(total));
            c.setRequestProperty("Upload-Metadata", metadata(i)); c.connect(); int code=c.getResponseCode();
            if(code<200||code>=300) throw new IOException("TUS creation failed ("+code+")");
            location=c.getHeaderField("Location"); if(location==null) throw new IOException("TUS creation returned no location"); saveLocation(id,location);
        }
        if(location.startsWith("/")) location=new URL(endpoint).getProtocol()+"://"+new URL(endpoint).getHost()+location;
        // Ask the TUS server for its authoritative offset after a process restart.
        try {
            HttpURLConnection head=(HttpURLConnection)new URL(location).openConnection(); timeouts(head);
            head.setRequestMethod("HEAD"); headers(head,i,token); head.connect();
            if (head.getResponseCode() >= 200 && head.getResponseCode() < 400) {
                String serverOffset=head.getHeaderField("Upload-Offset");
                if (serverOffset != null) { offset=Long.parseLong(serverOffset); saveOffset(id,offset); }
            }
        } catch (Exception ignored) { /* the persisted offset remains the safe fallback */ }
        while(offset<total) {
            byte[] bytes=new byte[(int)Math.min(CHUNK,total-offset)]; RandomAccessFile raf=new RandomAccessFile(source,"r"); raf.seek(offset); raf.readFully(bytes); raf.close();
            Exception failure=null; boolean done=false;
            for(int attempt=0;attempt<4&&!done;attempt++) try {
                HttpURLConnection c=(HttpURLConnection)new URL(location).openConnection(); timeouts(c); c.setRequestMethod("PATCH"); headers(c,i,token); c.setDoOutput(true);
                c.setRequestProperty("Upload-Offset",String.valueOf(offset)); c.setRequestProperty("Content-Type","application/offset+octet-stream"); c.setFixedLengthStreamingMode(bytes.length);
                c.getOutputStream().write(bytes); int code=c.getResponseCode(); if(code<200||code>=300) throw new IOException("TUS PATCH failed ("+code+")");
                offset=Long.parseLong(Optional.ofNullable(c.getHeaderField("Upload-Offset")).orElse(String.valueOf(offset+bytes.length))); saveOffset(id,offset); done=true; progress(id,"upload","running",offset,total,0,null,i.getStringExtra("path"),null,null);
            } catch(Exception e){failure=e; long serverOffset=refreshOffset(location,i,token); if(serverOffset>=0){offset=serverOffset;saveOffset(id,offset);if(offset>=total)done=true;} if(!done)Thread.sleep(500L << attempt);}
            if(!done) throw failure;
        }
        progress(id,"upload","complete",total,total,0,null,i.getStringExtra("path"),null,null); deleteStaging(source); clear(id);
    }
    private void download(Intent i) throws Exception {
        String id=safe(i.getStringExtra("id")), url=i.getStringExtra("url"), name=id+"-"+safe(i.getStringExtra("fileName"));
        File dir=new File(getFilesDir(),"downloads"), out=new File(dir,name); if(!dir.exists())dir.mkdirs();
        long total; boolean ranged; int count=0;
        try { total=probeRange(url); ranged=true; }
        catch (RangeUnsupportedException unsupported) { total=i.getLongExtra("totalBytes",0); ranged=false; }
        if(ranged){
            long part=Math.max(4L*1024*1024,(total+3)/4);
            count=(int)Math.min(4,(total+part-1)/part);
            ExecutorService p=Executors.newFixedThreadPool(count); List<Future<?>> fs=new ArrayList<>();
            try {
                for(int n=0;n<count;n++){long a=n*part,b=Math.min(total-1,a+part-1);final int index=n;final long aa=a,bb=b;fs.add(p.submit(()->range(url,id,dir,index,aa,bb,total)));}
                for(Future<?> f:fs)f.get();
            } catch (ExecutionException e) {
                for(Future<?> f:fs)f.cancel(true); p.shutdownNow(); cleanupParts(dir,id);
                Throwable cause=e.getCause(); if(cause instanceof RangeUnsupportedException){ranged=false;} else throw new IOException("Parallel range download failed",cause);
            } finally { p.shutdownNow(); p.awaitTermination(5,TimeUnit.SECONDS); }
        }
        if(!ranged) { cleanupParts(dir,id); stream(url,out,id,total,i.getStringExtra("title")); }
        else {FileOutputStream o=new FileOutputStream(out);for(int n=0;n<count;n++){File f=new File(dir,id+".part"+n);if(!f.exists())throw new IOException("Missing download part "+n);FileInputStream in=new FileInputStream(f);byte[] b=new byte[8192];int x;while((x=in.read(b))>=0)o.write(b,0,x);in.close();f.delete();}o.close();}
        progress(id,"download","complete",out.length(),out.length(),0,null,null,relative(out),i.getStringExtra("metadata"));
    }
    private void range(String url,String id,File dir,int index,long a,long b,long total)throws Exception{
        File f=new File(dir,id+".part"+index), tmp=new File(dir,id+".part"+index+".tmp");
        long expected=b-a+1, existing=f.length();
        if(existing>expected){f.delete();existing=0;}
        if(existing==expected)return;
        Exception failure=null;
        for(int attempt=0;attempt<4;attempt++){
            long start=a+f.length(); if(start>b)return;
            try {
                HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();timeouts(c);c.setRequestProperty("Range","bytes="+start+"-"+b);c.connect();
                if(c.getResponseCode()!=206)throw new RangeUnsupportedException();
                String cr=c.getHeaderField("Content-Range");
                if(cr==null||!cr.matches("bytes\\s+"+start+"-"+b+"/"+total))throw new RangeUnsupportedException();
                InputStream in=c.getInputStream();FileOutputStream o=new FileOutputStream(tmp,false);byte[] z=new byte[32768];int n;long got=0,lastReport=0,lastAt=System.nanoTime();
                 while((n=in.read(z))>0){got+=n;if(got>b-start+1)throw new IOException("Range response body is too large");o.write(z,0,n);long now=System.nanoTime();if(got-lastReport>=512*1024||now-lastAt>=500_000_000L){o.flush();progress(id,"download","running",downloaded(dir,id),total,0,null,null,null,null);lastReport=got;lastAt=now;}}
                o.close();in.close();if(got!=b-start+1)throw new IOException("Range response body is truncated");
                FileInputStream appendIn=new FileInputStream(tmp);FileOutputStream appendOut=new FileOutputStream(f,true);byte[] copy=new byte[32768];while((n=appendIn.read(copy))>0)appendOut.write(copy,0,n);appendIn.close();appendOut.close();tmp.delete();
                progress(id,"download","running",downloaded(dir,id),total,0,null,null,null,null);return;
            } catch(RangeUnsupportedException e){tmp.delete();throw e;}
            catch(Exception e){failure=e;tmp.delete();if(attempt<3)Thread.sleep(500L<<attempt);}
        }
        throw failure==null?new IOException("Range download failed"):failure;
    }
    private void stream(String url,File out,String id,long total,String title)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();timeouts(c);c.connect();InputStream in=c.getInputStream();FileOutputStream o=new FileOutputStream(out);byte[] b=new byte[32768];int n;long done=0;while((n=in.read(b))>0){o.write(b,0,n);done+=n;progress(id,"download","running",done,total,0,null,null,null,null);}o.close();in.close();}
    private static long downloaded(File d,String id){long n=0;File[] fs=d.listFiles((x,s)->s.startsWith(id+".part"));if(fs!=null)for(File f:fs)n+=f.length();return n;}
    private long probeRange(String url)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();timeouts(c);c.setRequestProperty("Range","bytes=0-0");c.connect();if(c.getResponseCode()!=206)throw new RangeUnsupportedException();String cr=c.getHeaderField("Content-Range");if(cr==null||!cr.matches("bytes\\s+0-0/\\d+"))throw new RangeUnsupportedException();InputStream in=c.getInputStream();int first=in.read(), second=in.read();in.close();if(first<0||second>=0)throw new RangeUnsupportedException();return Long.parseLong(cr.substring(cr.indexOf('/')+1));}
    private void cleanupParts(File dir,String id){File[] fs=dir.listFiles((x,s)->s.startsWith(id+".part"));if(fs!=null)for(File f:fs)f.delete();}
    private static class RangeUnsupportedException extends IOException { RangeUnsupportedException(){super("Range requests are unsupported");} }
    private static void timeouts(HttpURLConnection c){c.setConnectTimeout(CONNECT_TIMEOUT_MS);c.setReadTimeout(READ_TIMEOUT_MS);}
    private long refreshOffset(String location,Intent i,String token){try{HttpURLConnection h=(HttpURLConnection)new URL(location).openConnection();timeouts(h);h.setRequestMethod("HEAD");headers(h,i,token);h.connect();String value=h.getHeaderField("Upload-Offset");return value==null?-1:Long.parseLong(value);}catch(Exception ignored){return -1;}}
    private void headers(HttpURLConnection c,Intent i,String token){c.setRequestProperty("Authorization","Bearer "+token);c.setRequestProperty("apikey",i.getStringExtra("apiKey"));c.setRequestProperty("Tus-Resumable","1.0.0");}
    private String metadata(Intent i){return "bucketName "+b(i.getStringExtra("bucket"))+",objectName "+b(i.getStringExtra("path"))+",contentType "+b(i.getStringExtra("contentType"))+",cacheControl "+b(i.getStringExtra("cacheControl"));}
    private String b(String s){return Base64.encodeToString(s.getBytes(StandardCharsets.UTF_8),Base64.NO_WRAP);}
    private static class Sample { final long at, bytes; Sample(long at,long bytes){this.at=at;this.bytes=bytes;} }
    private void progress(String id,String kind,String status,long bytes,long total,long speed,String error,String storage,String path,String meta){try{long now=System.currentTimeMillis(), t=startedAt.getOrDefault(id,now), first=startedBytes.getOrDefault(id,bytes);long elapsed=Math.max(1,now-t);long measured=((bytes-first)*1000L)/elapsed;ArrayDeque<Sample> q=samples.computeIfAbsent(id,k->new ArrayDeque<>());synchronized(q){q.addLast(new Sample(now,bytes));while(q.size()>1&&now-q.peekFirst().at>10_000)q.removeFirst();Sample firstSample=q.peekFirst();if(firstSample!=null&&now>firstSample.at)measured=((bytes-firstSample.bytes)*1000L)/(now-firstSample.at);}long rate=speed>0?speed:Math.max(0,measured);JSONObject o=new JSONObject();o.put("id",id).put("kind",kind).put("status",status).put("bytesTransferred",bytes).put("totalBytes",total).put("bytesPerSecond",rate);if(error!=null)o.put("error",error);if(storage!=null)o.put("storagePath",storage);if(path!=null)o.put("relativePath",path);if(meta!=null)try{o.put("metadata",new JSONObject(meta));}catch(Exception ignored){}sendBroadcast(new Intent(ACTION_PROGRESS).setPackage(getPackageName()).putExtra("payload",o.toString()));if(total>0)updateNotification(kind+" "+Math.min(100,(bytes*100)/total)+"% · "+rate+" B/s");saveSnapshot(id,kind,status,bytes,total,path,meta,o);}catch(Exception ignored){}}
    private void updateNotification(String s){((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(NOTIFICATION_ID,notification(s));}
    private Notification notification(String s){return new NotificationCompat.Builder(this,"transfers").setSmallIcon(android.R.drawable.stat_sys_upload).setContentTitle("YourWorld transfers").setContentText(s).setOngoing(true).build();}
    private void createChannel(){if(Build.VERSION.SDK_INT>=26)((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(new NotificationChannel("transfers","Transfers",NotificationManager.IMPORTANCE_LOW));}
    private static String safe(String s){return s==null?"file":s.replaceAll("[^a-zA-Z0-9._-]","_");}
    private static String relative(File f){return "downloads/"+f.getName();}
    private void deleteStaging(File f){f.delete();}
    private void clear(String id){getSharedPreferences("transfer_state",0).edit().remove(id+".offset").remove(id+".location").apply();}
    private long readOffset(String id){return getSharedPreferences("transfer_state",0).getLong(id+".offset",0);}
    private String readLocation(String id){return getSharedPreferences("transfer_state",0).getString(id+".location",null);}
    private void saveOffset(String id,long n){getSharedPreferences("transfer_state",0).edit().putLong(id+".offset",n).apply();}
    private void saveLocation(String id,String s){getSharedPreferences("transfer_state",0).edit().putString(id+".location",s).apply();}
    private void saveSnapshot(String id,String k,String s,long b,long t,String p,String m,JSONObject event){getSharedPreferences("transfer_snapshots",0).edit().putString(id,event.toString()).apply();}
    public static File findStagingFile(Context c,String id){File d=new File(c.getFilesDir(),"transfers/uploads");File[] fs=d.listFiles((x,n)->n.startsWith(safe(id)+"-"));return fs==null||fs.length==0?null:fs[0];}
    public static void discardUpload(Context c,String id) {
        String clean=safe(id);
        File staged=findStagingFile(c,clean);
        if(staged!=null) staged.delete();
        c.getSharedPreferences("transfer_state",0).edit().remove(clean+".offset").remove(clean+".location").apply();
        c.getSharedPreferences("transfer_snapshots",0).edit().remove(clean).apply();
    }
    public static JSONArray snapshots(Context c){JSONArray out=new JSONArray();Map<String,?> all=c.getSharedPreferences("transfer_snapshots",0).getAll();for(Object value:all.values())if(value instanceof String)try{out.put(new JSONObject((String)value));}catch(Exception ignored){}return out;}
    public static Uri downloadUri(Context c,String rel)throws Exception{File f=privateDownload(c,rel);return Uri.fromFile(f);}
    public static void deleteDownload(Context c,String rel)throws Exception{privateDownload(c,rel).delete();}
    private static File privateDownload(Context c,String rel)throws Exception{if(rel==null||rel.contains("..")||!rel.startsWith("downloads/"))throw new SecurityException("Invalid download path");File root=new File(c.getFilesDir(),"downloads").getCanonicalFile(),f=new File(c.getFilesDir(),rel).getCanonicalFile();if(!f.getPath().startsWith(root.getPath()+File.separator))throw new SecurityException("Download is outside app storage");return f;}
}
import { useCallback, useEffect, useState } from "react";

export type AppLanguage = "en" | "hi";

export const APP_LANGUAGE_STORAGE_KEY = "app_language";
const APP_LANGUAGE_EVENT = "yourworld:app-language-change";

const messages = {
  en: {
    mainNavigation: "Main navigation",
    navHome: "Home",
    navReels: "Reels",
    navCreate: "Create",
    navChat: "Chat",
    navProfile: "Profile",
    unreadMessage: "unread message",
    unreadMessages: "unread messages",
    settingsTitle: "Settings",
    account: "Account",
    creatorAnalytics: "Creator Analytics",
    creatorAnalyticsHint: "Views, watch hours, followers & top content",
    monetizationWallet: "Monetization & Wallet",
    monetizationWalletHint: "Earnings, courses, payouts & tax invoices",
    dataMediaQuality: "Data & Media Quality",
    dataMediaQualityHint: "Data saver and upload quality",
    privacy: "Privacy",
    privacyHint: "Blocked accounts",
    messagesDirectRequests: "Messages & Direct Requests",
    messagesDirectRequestsHint: "Who can message you and read receipts",
    timeManagement: "Time Management",
    timeManagementHint: "Daily usage and break reminders",
    notifications: "Notifications",
    notificationsHint: "Likes, channel & system alerts",
    helpSupport: "Help & Support",
    about: "About",
    logOut: "Log Out",
    appLanguage: "App Language",
    appLanguageHint: "Choose English or Hindi for navigation and core settings.",
    englishDefault: "English (Default)",
    hindiLanguage: "हिंदी (Hindi)",
    backToSettings: "Back to Settings",
    backToPrivacy: "Back to Privacy",
    privateAccount: "Private account",
    privateAccountHint: "Only approved followers can see your posts",
    activityStatus: "Show activity status",
    activityStatusHint: "Display when you were last active",
    blockedAccounts: "Blocked accounts",
    manageBlockedAccounts: "Manage people you have blocked",
    hiddenCreators: "Hidden Creators",
    hiddenCreatorsHint: "Manage creators you don't recommend",
    notInterestedPosts: "Not Interested Posts",
    notInterestedPostsHint: "Review videos you've hidden from recommendations",
    commentsHiddenWords: "Comments & Hidden Words",
    commentsHiddenWordsHint: "Filter offensive comments and custom words",
    dataSaver: "Data Saver",
    dataSaverHint: "Start supported long videos at 480p on cellular or slow networks. Reels stay unchanged.",
    uploadHighestQuality: "Upload at Highest Quality",
    uploadHighestQualityHint: "Keep the original long-video file when it fits the storage limit.",
    whoCanMessage: "Who can message you",
    whoCanMessageHint: "Choose who may start a new direct-message conversation.",
    everyone: "Everyone",
    onlyPeopleYouFollow: "Only People You Follow",
    readReceipts: "Read Receipts",
    readReceiptsHint: "When off, ordinary message reads are not sent as seen receipts. View Once and after-view messages still record that they were opened.",
    messageRequestNote: "Message-request access is saved on this device; it does not change server-side access rules.",
    hideOffensiveComments: "Hide offensive comments",
    hideOffensiveCommentsHint: "Hide comments containing common English profanity from your view.",
    customHiddenWords: "Custom hidden words",
    hiddenWordsHint: "Matching comments and replies are hidden only from your view.",
    addWordPlaceholder: "Add a word or phrase",
    add: "Add",
    hiddenWordsAria: "Hidden words",
    noCustomWords: "No custom words added.",
    likes: "Likes",
    comments: "Comments",
    newFollowers: "New followers",
    messages: "Messages",
    calls: "Calls",
    callsHint: "Audio & video call rings and alerts",
    channelMonetization: "Channel & monetization",
    systemAlerts: "System alerts",
    dailyUsage: "Daily usage",
    usageTodayHint: "Time YourWorld is open and visible today.",
    usageAgainstLimit: "Daily usage against reminder limit",
    dailyLimitReminder: "Daily limit reminder",
    dailyLimitReminderOff: "Daily limit reminder is off.",
    reminderAt: "Reminder at",
    thirtyMinutes: "30 minutes",
    oneHour: "1 hour",
    twoHours: "2 hours",
    off: "Off",
    signInToManageCreators: "Sign in to manage Hidden Creators.",
    signInToManageNotInterested: "Sign in to manage Not Interested Posts.",
    blockedAccountsLoading: "Loading blocked accounts…",
    blockedAccountsLoadError: "Could not load blocked accounts. Please try again.",
    noBlockedAccounts: "No blocked accounts",
    blockedAccountsEmptyHint: "People you block will appear here.",
    unblock: "Unblock",
    unblocking: "Unblocking…",
    helpCenter: "Help center",
    helpCenterHint: "Guides and troubleshooting",
    reportProblem: "Report a problem",
    reportProblemHint: "Tell us what went wrong",
    communityGuidelines: "Community guidelines",
    communityGuidelinesHint: "Keep YourWorld safe and positive",
    copyrightPolicy: "Copyright & DMCA Policy",
    copyrightPolicyHint: "Takedown procedure & Safe Harbor",
    translationSee: "See translation",
    translationSeeOriginal: "See original",
    translationLoading: "Translating…",
    translationFailed: "Could not translate this comment. Please try again.",
  },
  hi: {
    mainNavigation: "मुख्य नेविगेशन",
    navHome: "होम",
    navReels: "रील्स",
    navCreate: "बनाएँ",
    navChat: "चैट",
    navProfile: "प्रोफ़ाइल",
    unreadMessage: "अपठित संदेश",
    unreadMessages: "अपठित संदेश",
    settingsTitle: "सेटिंग्स",
    account: "खाता",
    creatorAnalytics: "क्रिएटर एनालिटिक्स",
    creatorAnalyticsHint: "व्यूज़, देखने का समय, फ़ॉलोअर्स और लोकप्रिय सामग्री",
    monetizationWallet: "कमाई और वॉलेट",
    monetizationWalletHint: "कमाई, कोर्स, भुगतान और टैक्स इनवॉइस",
    dataMediaQuality: "डेटा और मीडिया गुणवत्ता",
    dataMediaQualityHint: "डेटा सेवर और अपलोड गुणवत्ता",
    privacy: "गोपनीयता",
    privacyHint: "ब्लॉक किए गए खाते",
    messagesDirectRequests: "संदेश और सीधे अनुरोध",
    messagesDirectRequestsHint: "कौन आपको संदेश भेज सकता है और पढ़ने की रसीदें",
    timeManagement: "समय प्रबंधन",
    timeManagementHint: "दैनिक उपयोग और ब्रेक रिमाइंडर",
    notifications: "सूचनाएँ",
    notificationsHint: "लाइक, चैनल और सिस्टम अलर्ट",
    helpSupport: "सहायता और सपोर्ट",
    about: "ऐप के बारे में",
    logOut: "लॉग आउट",
    appLanguage: "ऐप की भाषा",
    appLanguageHint: "नेविगेशन और मुख्य सेटिंग्स के लिए अंग्रेज़ी या हिंदी चुनें।",
    englishDefault: "English (Default)",
    hindiLanguage: "हिंदी (Hindi)",
    backToSettings: "सेटिंग्स पर वापस जाएँ",
    backToPrivacy: "गोपनीयता पर वापस जाएँ",
    privateAccount: "निजी अकाउंट",
    privateAccountHint: "आपकी पोस्ट केवल मंज़ूर किए गए फ़ॉलोअर्स देख सकते हैं",
    activityStatus: "एक्टिविटी स्टेटस दिखाएँ",
    activityStatusHint: "दिखाएँ कि आप आख़िरी बार कब सक्रिय थे",
    blockedAccounts: "ब्लॉक किए गए खाते",
    manageBlockedAccounts: "आपके द्वारा ब्लॉक किए गए लोगों को मैनेज करें",
    hiddenCreators: "छिपाए गए क्रिएटर्स",
    hiddenCreatorsHint: "उन क्रिएटर्स को मैनेज करें जिनकी पोस्ट आप नहीं देखना चाहते",
    notInterestedPosts: "रुचि नहीं वाली पोस्ट",
    notInterestedPostsHint: "सुझावों से छिपाए गए वीडियो देखें",
    commentsHiddenWords: "कमेंट और छिपाए गए शब्द",
    commentsHiddenWordsHint: "आपत्तिजनक कमेंट और कस्टम शब्द फ़िल्टर करें",
    dataSaver: "डेटा सेवर",
    dataSaverHint: "मोबाइल डेटा या धीमे नेटवर्क पर समर्थित लंबे वीडियो 480p में शुरू करें। रील्स में बदलाव नहीं होगा।",
    uploadHighestQuality: "सबसे अच्छी गुणवत्ता में अपलोड करें",
    uploadHighestQualityHint: "स्टोरेज सीमा के अंदर लंबे वीडियो की मूल फ़ाइल रखें।",
    whoCanMessage: "आपको कौन संदेश भेज सकता है",
    whoCanMessageHint: "चुनें कि कौन नई डायरेक्ट बातचीत शुरू कर सकता है।",
    everyone: "सभी",
    onlyPeopleYouFollow: "सिर्फ़ वे जिन्हें आप फ़ॉलो करते हैं",
    readReceipts: "पढ़ने की रसीदें",
    readReceiptsHint: "बंद होने पर सामान्य संदेशों के पढ़े जाने की सूचना नहीं भेजी जाएगी। View Once और देखने के बाद मिटने वाले संदेश खुलने का रिकॉर्ड रखेंगे।",
    messageRequestNote: "मैसेज अनुरोध की सेटिंग इसी डिवाइस पर सेव होती है; इससे सर्वर की पहुँच सेटिंग नहीं बदलती।",
    hideOffensiveComments: "आपत्तिजनक कमेंट छिपाएँ",
    hideOffensiveCommentsHint: "आम अंग्रेज़ी गाली वाले कमेंट आपको नहीं दिखेंगे।",
    customHiddenWords: "अपने छिपाए जाने वाले शब्द",
    hiddenWordsHint: "मेल खाने वाले कमेंट और जवाब सिर्फ़ आपको नहीं दिखेंगे।",
    addWordPlaceholder: "शब्द या वाक्यांश जोड़ें",
    add: "जोड़ें",
    hiddenWordsAria: "छिपाए गए शब्द",
    noCustomWords: "अभी कोई कस्टम शब्द नहीं जोड़ा गया।",
    likes: "लाइक",
    comments: "कमेंट",
    newFollowers: "नए फ़ॉलोअर्स",
    messages: "संदेश",
    calls: "कॉल",
    callsHint: "ऑडियो और वीडियो कॉल की रिंग और अलर्ट",
    channelMonetization: "चैनल और कमाई",
    systemAlerts: "सिस्टम अलर्ट",
    dailyUsage: "दैनिक उपयोग",
    usageTodayHint: "आज YourWorld कितनी देर खुला और स्क्रीन पर रहा।",
    usageAgainstLimit: "रिमाइंडर सीमा के अनुसार दैनिक उपयोग",
    dailyLimitReminder: "दैनिक सीमा रिमाइंडर",
    dailyLimitReminderOff: "दैनिक सीमा रिमाइंडर बंद है।",
    reminderAt: "रिमाइंडर",
    thirtyMinutes: "30 मिनट",
    oneHour: "1 घंटा",
    twoHours: "2 घंटे",
    off: "बंद",
    signInToManageCreators: "छिपाए गए क्रिएटर्स मैनेज करने के लिए साइन इन करें।",
    signInToManageNotInterested: "रुचि नहीं वाली पोस्ट मैनेज करने के लिए साइन इन करें।",
    blockedAccountsLoading: "ब्लॉक किए गए खाते लोड हो रहे हैं…",
    blockedAccountsLoadError: "ब्लॉक किए गए खाते लोड नहीं हो सके। फिर से कोशिश करें।",
    noBlockedAccounts: "कोई ब्लॉक किया गया खाता नहीं",
    blockedAccountsEmptyHint: "आप जिन लोगों को ब्लॉक करेंगे, वे यहाँ दिखेंगे।",
    unblock: "अनब्लॉक",
    unblocking: "अनब्लॉक हो रहा है…",
    helpCenter: "सहायता केंद्र",
    helpCenterHint: "गाइड और समस्या निवारण",
    reportProblem: "समस्या की रिपोर्ट करें",
    reportProblemHint: "बताएँ क्या गलत हुआ",
    communityGuidelines: "कम्युनिटी दिशानिर्देश",
    communityGuidelinesHint: "YourWorld को सुरक्षित और सकारात्मक रखें",
    copyrightPolicy: "कॉपीराइट और DMCA नीति",
    copyrightPolicyHint: "टेकडाउन प्रक्रिया और Safe Harbor",
    translationSee: "अनुवाद देखें",
    translationSeeOriginal: "मूल देखें",
    translationLoading: "अनुवाद हो रहा है…",
    translationFailed: "इस कमेंट का अनुवाद नहीं हो सका। फिर से कोशिश करें।",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export type AppTextKey = keyof typeof messages.en;

function readStoredLanguage(): AppLanguage {
  try {
    return window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

export function useAppLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    const syncLanguage = () => {
      const nextLanguage = readStoredLanguage();
      setLanguageState(nextLanguage);
      document.documentElement.lang = nextLanguage;
    };
    syncLanguage();
    window.addEventListener(APP_LANGUAGE_EVENT, syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener(APP_LANGUAGE_EVENT, syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    try {
      window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Keep the language change active for this page even if storage is unavailable.
    }
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new Event(APP_LANGUAGE_EVENT));
  }, []);

  const t = useCallback(
    (key: AppTextKey) => messages[language][key],
    [language],
  );

  return { language, setLanguage, t };
}

/** Fast script check keeps the translation action off comments already in the selected language. */
export function commentMayNeedTranslation(text: string, targetLanguage: AppLanguage) {
  const containsDevanagari = /[\u0900-\u097f]/u.test(text);
  return targetLanguage === "hi" ? !containsDevanagari : containsDevanagari;
}

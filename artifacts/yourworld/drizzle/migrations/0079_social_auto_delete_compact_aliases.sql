-- Accept compact setting identifiers written by older mobile clients while
-- preserving the canonical and legacy values already stored by the app.

alter table public.conversations
  drop constraint if exists conversations_auto_delete_setting_check;
alter table public.conversations
  add constraint conversations_auto_delete_setting_check
  check (
    auto_delete_setting in (
      'off',
      'after_view',
      'immediately',
      'after_view_15s',
      '15s',
      'after_view_1m',
      '1m',
      'after_view_10m',
      '10m',
      '3_hours',
      '5_hours',
      '5h',
      '6_hours',
      '24_hours',
      '24h'
    )
  );

alter table public.conversation_preferences
  drop constraint if exists conversation_preferences_auto_delete_check;
alter table public.conversation_preferences
  add constraint conversation_preferences_auto_delete_check
  check (
    auto_delete_setting in (
      'off',
      'after_view',
      'immediately',
      'after_view_15s',
      '15s',
      'after_view_1m',
      '1m',
      'after_view_10m',
      '10m',
      '3_hours',
      '5_hours',
      '5h',
      '6_hours',
      '24_hours',
      '24h'
    )
  );
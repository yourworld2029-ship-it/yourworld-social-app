export function shouldHydrateChatSettings(options: {
  participantPreference: unknown;
  conversationAutoDeleteSetting: unknown;
  conversationProtection: unknown;
}) {
  return (
    options.participantPreference != null ||
    options.conversationAutoDeleteSetting != null ||
    options.conversationProtection != null
  );
}

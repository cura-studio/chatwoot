import { describe, expect, it, vi } from 'vitest';

import PhoneRequest from '../PhoneRequest.vue';

const { shouldShow } = PhoneRequest.computed;
const { save } = PhoneRequest.methods;

const phoneField = { name: 'phoneNumber', enabled: true };
const visible = overrides => ({
  dismissed: false,
  preChatFormEnabled: true,
  phoneField,
  conversationSize: 1,
  currentUser: { has_phone_number: false },
  ...overrides,
});

describe('PhoneRequest shouldShow', () => {
  it('shows for a returning visitor without phone', () => {
    expect(shouldShow.call(visible())).toBe(true);
  });

  it('hides when the contact already has a phone', () => {
    expect(
      shouldShow.call(visible({ currentUser: { has_phone_number: true } }))
    ).toBe(false);
  });

  it('hides while the contact is not loaded yet', () => {
    expect(shouldShow.call(visible({ currentUser: {} }))).toBe(false);
  });

  it('hides without a conversation (pre-chat form handles it)', () => {
    expect(shouldShow.call(visible({ conversationSize: 0 }))).toBe(false);
  });

  it('hides when the inbox does not ask for the phone', () => {
    expect(shouldShow.call(visible({ phoneField: undefined }))).toBe(false);
    expect(shouldShow.call(visible({ preChatFormEnabled: false }))).toBe(false);
  });

  it('hides after "not now"', () => {
    expect(shouldShow.call(visible({ dismissed: true }))).toBe(false);
  });
});

describe('PhoneRequest save', () => {
  const context = phone => ({
    phone,
    error: '',
    isSaving: false,
    $t: key => key,
    $store: { dispatch: vi.fn().mockResolvedValue() },
  });

  it('sends a Brazilian number in E.164', async () => {
    const ctx = context('(11) 91234-5678');
    await save.call(ctx);
    expect(ctx.$store.dispatch).toHaveBeenCalledWith('contacts/update', {
      user: { phone_number: '+5511912345678' },
    });
    expect(ctx.error).toBe('');
  });

  it('rejects an invalid number without calling the API', async () => {
    const ctx = context('123');
    await save.call(ctx);
    expect(ctx.$store.dispatch).not.toHaveBeenCalled();
    expect(ctx.error).toBe('PRE_CHAT_FORM.FIELDS.PHONE_NUMBER.VALID_ERROR');
  });
});

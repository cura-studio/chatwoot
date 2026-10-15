<script>
// CURA: asks returning visitors (contact without phone) for their WhatsApp.
// Shown only when the inbox pre-chat form has the phone field enabled, the
// visitor already has a conversation (so the pre-chat form is skipped) and
// the contact has no phone number yet. Non-blocking: chat keeps working.
import { mapGetters } from 'vuex';
import { getContrastingTextColor } from '@chatwoot/utils';
import configMixin from 'widget/mixins/configMixin';
import {
  isPhoneNumberValidWithDialCode,
  normalizePhoneWithDefaultBrazil,
} from 'shared/helpers/Validators';

export default {
  mixins: [configMixin],
  data() {
    return {
      phone: '',
      error: '',
      isSaving: false,
      dismissed: false,
    };
  },
  computed: {
    ...mapGetters({
      currentUser: 'contacts/getCurrentUser',
      conversationSize: 'conversation/getConversationSize',
      widgetColor: 'appConfig/getWidgetColor',
    }),
    phoneField() {
      return this.preChatFormOptions.preChatFields.find(
        field => field.name === 'phoneNumber' && field.enabled
      );
    },
    shouldShow() {
      return (
        !this.dismissed &&
        this.preChatFormEnabled &&
        !!this.phoneField &&
        this.conversationSize > 0 &&
        !!this.currentUser &&
        this.currentUser.has_phone_number === false
      );
    },
    textColor() {
      return getContrastingTextColor(this.widgetColor);
    },
  },
  methods: {
    async save() {
      if (this.isSaving) return;
      const value = normalizePhoneWithDefaultBrazil(this.phone);
      if (!value || !isPhoneNumberValidWithDialCode(value)) {
        this.error = this.$t('PRE_CHAT_FORM.FIELDS.PHONE_NUMBER.VALID_ERROR');
        return;
      }
      this.error = '';
      this.isSaving = true;
      try {
        await this.$store.dispatch('contacts/update', {
          user: { phone_number: value },
        });
      } finally {
        this.isSaving = false;
      }
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="shouldShow"
      class="mb-2 p-3 rounded-lg bg-n-background dark:bg-n-solid-2 outline outline-1 outline-n-weak text-n-slate-12"
    >
      <p class="mb-2 text-sm leading-5">{{ $t('PHONE_REQUEST.TITLE') }}</p>
      <form class="flex gap-2" @submit.prevent="save">
        <input
          v-model="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          name="phoneRequest"
          :placeholder="phoneField.placeholder || ''"
          :aria-label="phoneField.label"
          class="flex-1 min-w-0 h-9 px-3 text-sm rounded-lg bg-n-alpha-black2 !outline-none"
        />
        <button
          type="submit"
          :disabled="isSaving"
          class="h-9 px-3 text-sm font-medium rounded-lg"
          :style="{ background: widgetColor, color: textColor }"
        >
          {{ $t('PHONE_REQUEST.SAVE') }}
        </button>
      </form>
      <p v-if="error" class="mt-1 mb-0 text-xs text-n-ruby-9">{{ error }}</p>
      <button
        type="button"
        class="mt-1 text-xs text-n-slate-11 underline"
        @click="dismissed = true"
      >
        {{ $t('PHONE_REQUEST.LATER') }}
      </button>
    </div>
  </div>
</template>

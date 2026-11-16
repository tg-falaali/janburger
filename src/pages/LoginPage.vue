<template>
  <div class="login-page">
    <div class="login-card">
      <img class="login-logo" src="logo.png" alt="Jan Burger" width="240" height="146" />
      <div class="login-note">{{ t("login.title") }}</div>

      <q-form @submit.prevent="submit">
        <q-banner v-if="demo" dense class="demo-ribbon q-mb-md">
          {{ t("login.demo") }}
        </q-banner>

        <q-input
          v-model.trim="email" type="email" :label="t('login.email')" outlined
          autocomplete="username" class="q-mb-md"
          :rules="[(v) => !!v || t('login.needEmail')]" lazy-rules
        />
        <q-input
          v-model="password" :type="show ? 'text' : 'password'" :label="t('login.password')"
          outlined autocomplete="current-password"
          :rules="[(v) => !!v || t('login.needPassword')]" lazy-rules
        >
          <template #append>
            <q-icon
              :name="show ? 'visibility_off' : 'visibility'" class="cursor-pointer"
              role="button" :aria-label="show ? t('login.hide') : t('login.show')"
              @click="show = !show"
            />
          </template>
        </q-input>

        <div v-if="error" class="text-negative text-weight-bold q-mt-sm" role="alert">
          {{ error }}
        </div>

        <q-btn
          type="submit" outline rounded no-caps color="primary" :label="t('login.submit')"
          class="full-width q-mt-md" size="lg" :loading="busy"
        />
      </q-form>
    </div>

    <router-link to="/jan-brger" class="text-dark q-mt-lg">{{ t("login.back") }}</router-link>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth, authErrorMessage } from "src/composables/useAuth";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const router = useRouter();
const { signIn, demo } = useAuth();

const email = ref("");
const password = ref("");
const show = ref(false);
const busy = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    await signIn(email.value, password.value);
    router.push("/dashboard");
  } catch (err) {
    error.value = authErrorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

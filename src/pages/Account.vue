<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { supabase } from '../supabase';
const session = ref();
const appointments = ref<any>([]);
const router = useRouter();
const loading = ref(true);

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
    if (data.session) {
      getAppointments();
    }
  });

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session;
  });
});

async function getAppointments() {
  try {
    loading.value = true;

    let { data, error } = await supabase
      .from('appointments')
      .select('*, profiles!appointments_client_id_fkey(*)')
      .eq('doctor_id', session.value.user.id);
    console.log(session.value.user.id);
    if (error) throw error;
    if (data) {
      console.log(data);
      appointments.value = data;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function signOut() {
  try {
    loading.value = true;
    let { error } = await supabase.auth.signOut();
    router.push({ name: 'login' });
    if (error) throw error;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="form-widget">
    <p v-if="!session" class="text-red-500">
      Connectez vous pour voir vos rendez-vous
    </p>
    <h2 class="text-black">Vos rendez vous</h2>
    <table class="table-auto text-black w-full">
      <thead>
        <tr>
          <th>Date</th>
          <th>Client</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="appointment in appointments">
          <td>{{ appointment.date }}</td>
          <td>
            {{ appointment.profiles.first_name }}
            {{ appointment.profiles.last_name }}
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <button class="button block" @click.prevent="signOut" :disabled="loading">
        Sign Out
      </button>
    </div>
  </form>
</template>

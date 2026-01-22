import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      {/* SIGN UP ROUTE COMMENTED OUT - Guards are added via admin/backend only */}
      {/* <Stack.Screen name="sign-up" /> */}
    </Stack>
  );
}
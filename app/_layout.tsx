import { Stack } from "expo-router";
import {Dimensions, StyleSheet, Text, View} from 'react-native';

import { ToastProvider } from 'react-native-toast-notifications';
import { Icon } from '@rneui/themed';

const deviceWidth = Dimensions.get('window').width;

export default function RootLayout() {

  return (
    <ToastProvider
    renderType={{
      success: (toast) => (
        <View style={[styles.myToast, {backgroundColor: '#d4edda'}]}>
          <Text style={[styles.myToastText, {color: '#2a5834', fontWeight: 'bold'}]}>
            {toast.message}<Text style={[styles.myToastText, {fontWeight: 'normal'}]}> added</Text>
            </Text>
        </View>
      ),
      danger: (toast) => (
        <View style={[styles.myToast, {backgroundColor: '#f8d7da'}]}>
          <Text style={[styles.myToastText, {color: '#721c24', fontWeight: 'bold'}]}>
            {toast.message}<Text style={[styles.myToastText, {fontWeight: 'normal'}]}> could not be added</Text>
            </Text>
        </View>
      ),
    }}
    >
      <Stack screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
        <Stack.Screen name="index" />
        <Stack.Screen name="main" options={{animation: 'fade'}}/>
        <Stack.Screen name="card-search" />
        <Stack.Screen name="card-info" />
        <Stack.Screen name="card-list" />
        <Stack.Screen name="deck-explorer" />
        <Stack.Screen name="deck-viewer" />
        <Stack.Screen name="decklist-editor" />
        <Stack.Screen name="my-collection" />
        <Stack.Screen name="set-cards" />
      </Stack>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  myToast: {
    flexDirection: 'row',
    width: '90%',
    alignItems: 'center',
    borderRadius: 10,
    padding: deviceWidth * 0.05,
  },
  myToastText: {
    fontFamily: 'Roboto',
    fontSize: 18,
    width: '90%',
  },
});

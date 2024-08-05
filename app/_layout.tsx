import { Stack } from "expo-router";
import {Dimensions, StyleSheet, Text, View} from 'react-native';

import { ToastProvider } from 'react-native-toast-notifications';
import { Icon } from '@rneui/themed';

const deviceHeight = Dimensions.get('window').height;

export default function RootLayout() {

  return (
    <ToastProvider
    renderType={{
      success: (toast) => (
        <View style={[styles.myToast, {backgroundColor: '#d4edda'}]}>
          <Icon style={{marginRight: 8}} name="check-decagram" color="#2a5834" size={22} type="material-community" />
          <Text style={[styles.myToastText, {color: '#2a5834', fontWeight: 'bold'}]}>
            {toast.message}<Text style={[styles.myToastText, {fontWeight: 'normal'}]}> added</Text>
            </Text>
        </View>
      ),
      danger: (toast) => (
        <View style={[styles.myToast, {backgroundColor: '#f8d7da'}]}>
          <Icon style={{marginRight: 8}} name="alert-decagram" color="#721c24" size={22} type="material-community" />
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
    height: deviceHeight * 0.1,
    alignItems: 'center',
    borderRadius: 10,
    padding: 8,
    marginBottom: 4,
  },
  myToastText: {
    fontSize: 20,
    width: '90%',
  },
});

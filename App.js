/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainScreen from './src/Screens/main.js';
import CardSearchScreen from './src/Screens/card-search.js';
import CardInfoScreen from './src/Screens/card-info.js';
import CardListScreen from './src/Screens/card-list.js';
import SettingsScreen from './src/Screens/settings.js';
import MyCollectionScreen from './src/Screens/my-collection.js';
import SplashScreen from './src/Screens/splash.js';
import DeckExplorerScreen from './src/Screens/deck-explorer.js';
import DeckViewerScreen from './src/Screens/deck-viewer.js';
import DeckListEditorScreen from './src/Screens/decklist-editor.js';
import SetCardsScreen from './src/Screens/set-cards.js';

import { ToastProvider } from 'react-native-toast-notifications';
import { Icon } from '@rneui/themed';

const App = () => {
  const Stack = createNativeStackNavigator();

  const forFade = ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

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
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={MainScreen} options={{cardStyleInterpolator: forFade}} />
          <Stack.Screen name="CardSearch" component={CardSearchScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="CardInfo" component={CardInfoScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="DeckExplorer" component={DeckExplorerScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="DeckViewer" component={DeckViewerScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="DeckListEditor" component={DeckListEditorScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="MyCollection" component={MyCollectionScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="SetCards" component={SetCardsScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="CardList" component={CardListScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{animation: 'slide_from_right'}} />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
};

const styles = StyleSheet.create({
  myToast: {
    flexDirection: 'row',
    width: '90%',
    height: 60,
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

export default App;

import { useEffect } from 'react';
import { Image, View } from 'react-native';

import {StackActions} from '@react-navigation/native';
import { router } from 'expo-router';

export default function Splash() {

    const mainImg = require('../assets/images/my-splash.png');

    useEffect(() => {
        setTimeout(() => {
          router.replace('/main');
        }, 3000);
      }, []);

    return (
      <View style={{backgroundColor: '#0a090e'}}>
        <Image source={mainImg} style={{width: '100%', height: '100%'}} />
      </View>
      );
};
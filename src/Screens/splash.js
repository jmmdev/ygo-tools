/* eslint-disable react-native/no-inline-styles */
import React, { useEffect } from 'react';
import { Image, View } from 'react-native';

import {StackActions} from '@react-navigation/native';

const SplashScreen = ({navigation, route}) => {

    const mainImg = require('../../assets/ygo-tools.png');

    useEffect(() => {
        setTimeout(() => {
          navigation.dispatch(
            StackActions.replace('Main', {
            }),
          );
        }, 3000);
      }, [navigation]);

    return (
      <View style={{backgroundColor: '#0a090e'}}>
        <Image source={mainImg} style={{width: '100%', height: '100%'}} />
      </View>
      );
};

export default SplashScreen;

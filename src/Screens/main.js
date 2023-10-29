/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;
const imageHeight = Math.ceil(deviceWidth / 3.75);

const MainScreen = ({navigation, route}) => {

    const bg = require('../../assets/bg.png');
    const historyImg = require('../../assets/history.png');

    const card = require('../../assets/card.png');
    const deck = require('../../assets/deck.png');
    const collection = require('../../assets/collection.png');

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg}>
                <View style={styles.mainButtonsContainer}>
                    <View style={styles.mainButtonBg}>
                        <TouchableOpacity onPress={() => navigation.navigate('CardSearch')} style={styles.mainButton} activeOpacity={0.9}>
                            <ImageBackground style={{width: deviceWidth, height: imageHeight, justifyContent: 'center'}} source={card}>
                                <Text adjustsFontSizeToFit={true} style={styles.mainButtonText}>{'Card\nSearch'}</Text>
                            </ImageBackground>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.mainButtonBg}>
                        <TouchableOpacity onPress={() => navigation.navigate('DeckExplorer', {deckWasInvalid: false})} style={styles.mainButton} activeOpacity={0.9}>
                            <ImageBackground style={{width: deviceWidth, height: imageHeight, justifyContent: 'center'}} source={deck}>
                                <Text adjustsFontSizeToFit={true} style={styles.mainButtonText}>{'Deck\nExplorer'}</Text>
                            </ImageBackground>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.mainButtonBg}>
                        <TouchableOpacity onPress={() => navigation.navigate('MyCollection')} style={styles.mainButton} activeOpacity={0.9}>
                            <ImageBackground style={{width: deviceWidth, height: imageHeight, justifyContent: 'center'}} source={collection}>
                                <Text adjustsFontSizeToFit={true} style={styles.mainButtonText}>{'My\nCollection'}</Text>
                            </ImageBackground>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.historyButtonContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('CardList')} style={styles.historyButton} activeOpacity={0.5}>
                        <Image style={styles.historyImg} source={historyImg} />
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

const mainButtonsContainerGap = Math.max(deviceHeight * 0.02, 16);
const mainButtonsContainerHeight = 2 * mainButtonsContainerGap + imageHeight * 3;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a090e',
    },
    image: {
        height: '100%',
        justifyContent: 'flex-end',
    },
    mainButtonsContainer: {
        height: mainButtonsContainerHeight,
        gap: mainButtonsContainerGap,
    },
    mainButtonBg: {
        width: '100%',
        backgroundColor: '#ffffff',
    },
    mainButton: {
        width: '100%',
    },
    mainButtonText: {
        maxWidth: '50%',
        maxHeight: '75%',
        fontFamily: 'Matrix II Bold',
        color: '#fff',
        fontSize: deviceWidth * 0.09,
        padding: 0,
        letterSpacing: 4,
        marginHorizontal: '5%',
    },
    historyButtonContainer: {
        width: '100%',
        height: (deviceHeight - mainButtonsContainerHeight) / 2,
    },
    historyButton: {
        width: '35%',
        maxWidth: 200,
        aspectRatio: 1.307,
        flexDirection: 'row',
        justifyContent: 'center',
        alignSelf: 'center',
        marginVertical: deviceHeight * 0.075,
    },
    historyImg: {
        width: '100%',
        aspectRatio: 1.307,
    },
});

export default MainScreen;

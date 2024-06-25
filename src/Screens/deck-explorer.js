/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, FlatList, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { pickSingle } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import QRCodeScanner from 'react-native-qrcode-scanner';
import FastImage from 'react-native-fast-image';
import { RNCamera } from 'react-native-camera';
import Header from '../Components/header';
import { URL } from 'react-native-url-polyfill';

const dimensions = Dimensions.get('window');
const deviceWidth = dimensions.width;
const deviceHeight = dimensions.height;

const DeckExplorerScreen = ({navigation, route}) => {
    const bg = require('../../assets/bg.png');
    const empty = require('../../assets/no-deck-found.png');
    const placeholderImg = require('../../assets/placeholder-crop.png');


    const [decks, setDecks] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const errorTitle = useRef(null);
    const errorMessage = useRef(null);

    const isFocused = useIsFocused();

    useEffect(() => {
        const backAction = () => {
            if (showScanner) {
                setShowScanner(false);
                return true;
            }
        };

          const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
          );
          return () => backHandler.remove();
    }, [showScanner]);

    useEffect(() => {
        const getDecks = async () => {
            try {
                const value = await AsyncStorage.getItem('decks');
                if (value) {
                    setDecks(JSON.parse(value).sort((a, b) => a.name.localeCompare(b.name)));
                }
                if (route.params && route.params.deckWasInvalid) {
                    errorTitle.current = 'Error while retrieving deck info';
                    errorMessage.current = 'There was an error while processing your request. Your deck could not be retrieved.\n\nPlease check it out and try again';
                    setShowMessage(true);
                }
            } catch (e) {
                errorMessage.current = 'There was an error while retrieving your decks. Please go back and try again.';
                setShowMessage(true);
            }
        };

        if (isFocused) {
            getDecks();
        }
    }, [isFocused, route.params, route.params.deckWasInvalid]);

    const loadYdk = () => {
        pickSingle({
            type: 'application/octet-stream',
        }).then(async result => {
            try {
                const path = result.uri;
                const content = await RNFS.readFile(path, 'utf8');

                const deck = {name: result.name, content: content, img: null};

                navigation.navigate('DeckViewer', {deck: deck, new: true});

              } catch (e) {
                errorMessage.current = 'There was an error while processing your file. Please try again';
                setShowMessage(true);
              }
        })
        .catch((e) => {
            errorMessage.current = 'There was an error while processing your file. Please try again';
            setShowMessage(true);
        });
    };

    const loadQR = async (url) => {
        const myUrl = new URL(url);

        const pathNameRoutes = (myUrl.pathname.split('/')).filter(str => str !== '');

        let validUrl = null;
        const regExp = /^[a-zA-Z0-9]+$/;

        if (pathNameRoutes.length === 1) {
            validUrl =
                myUrl.protocol === 'https:' &&
                    myUrl.hostname === 'rentry.co' &&
                    myUrl.pathname &&
                    regExp.test(pathNameRoutes[0]);
        } else  if (pathNameRoutes.length === 2) {
            validUrl =
                myUrl.protocol === 'https:' &&
                myUrl.hostname === 'rentry.co' &&
                myUrl.pathname &&
                regExp.test(pathNameRoutes[0]) &&
                pathNameRoutes[1] === 'raw';
        } else {
            validUrl = false;
        }

        if (validUrl) {
            const actualUrl = url.includes('/raw') ? url : (url.charAt(url.length - 1) === '/' ? (url + 'raw') : (url + '/raw'));
            const response = await fetch(actualUrl, {
                headers: {
                    'Referer': 'https://rentry.co',
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain',
                },
            });
            if (response.ok) {
                const paste_content = await response.text();
                const deck = {name: url.replace('https://rentry.co/', 'deck-'), content: paste_content, img: null};
                navigation.navigate('DeckViewer', {deck: deck, new: true});
            } else {
                errorTitle.current = 'Error while retrieving deck info';
                errorMessage.current = 'There was an error while processing your request. Possible dead link in QR code.\n\nPlease check it out and try again';
                setShowMessage(true);
            }
        }
        else {
            errorTitle.current = 'Error with QR code';
            errorMessage.current = 'There was an error with the QR code. It may be an invalid link.\n\nPlease check it out and try again';
            setShowMessage(true);
        }
        setShowScanner(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg} resizeMode={'cover'}>
                <Header navigation={navigation} title={'Deck Explorer'}
                firstIcon={'folder-open-outline'} firstSize={deviceWidth * 0.08} firstFunction={() => loadYdk()}
                secondIcon={'md-scan-sharp'} secondSize={deviceWidth * 0.08} secondFunction={() => setShowScanner(true)}
                thirdIcon={'plus'} thirdSize={deviceWidth * 0.09} thirdFunction={() => navigation.navigate('DeckViewer', {new: true})}/>
                {
                (!decks || decks.length <= 0) &&
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyMsg}>
                        <Image source={empty} resizeMode="contain" style={{height: '50%'}}/>
                        <Text style={styles.emptyText}>NO DECKS FOUND</Text>
                    </View>
                </View>
                }
                {
                decks && decks.length > 0 &&
                <FlatList
                    data={decks}
                    keyExtractor={(item, index) => item.name}
                    renderItem={({item, index}) =>
                        <View>
                            <TouchableOpacity style={styles.buttonContainer}
                            onPress={() => {
                                navigation.navigate('DeckViewer', {deck: item, new: false});
                            }
                            }>
                                <FastImage style={[item.img ? styles.cardImg : styles.placeholderImg, {top: item.imgZone ? -(item.imgZone).toString() + '%' : '-100%'}]}
                                    source={item.img ? {uri: item.img} : placeholderImg} />
                                <View style={styles.textContainer}>
                                    <Text adjustsFontSizeToFit={true} style={styles.deckTitle}>{item.name}</Text>
                                    <Text adjustsFontSizeToFit={true} style={styles.numCards}>{item.cards} cards</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    }
                />
                }
                {
                showScanner &&
                <View style={styles.scannerContainer}>
                    <View style={styles.cameraBlackFrame}/>
                    <View style={styles.cameraContainer}>
                        <View style={styles.qrFrameContainer}>
                            <Image style={styles.qrFrame} source={require('../../assets/qr-scan-frame.png')} />
                        </View>
                        <QRCodeScanner
                        onRead={(e) => loadQR(e.data)}
                        flashMode={RNCamera.Constants.FlashMode.auto}/>
                    </View>
                    <View style={[styles.cameraBlackFrame, {padding: 32, alignItems: 'center'}]}>
                    <TouchableOpacity onPress={() => setShowScanner(false)} style={{width: '20%', aspectRatio: 1, justifyContent: 'center', opacity: 0.75}}>
                        <Icon color="#ffffff" name="close-o" size={deviceWidth * 0.12} type="evilicon"/>
                    </TouchableOpacity>
                    </View>
                </View>
                }
                {
                showMessage &&
                <View style={styles.errorContainer}>
                    <View style={styles.errorFrame}>
                        <Text style={styles.errorTitle}>{errorTitle.current}</Text>
                        <Text style={styles.errorText}>{errorMessage.current}</Text>
                        <TouchableOpacity style={styles.errorDismiss} onPress={() => {
                            setShowMessage(false);
                            if (route.params.deckWasInvalid) {
                                route.params.deckWasInvalid = false;
                            }
                        }}>
                            <Text style={styles.errorOkay}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                }
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    image: {
        height: '100%',
    },
    emptyContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMsg: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40%',
        opacity: 0.65,
    },
    emptyText: {
        width: '100%',
        color: '#ffffff',
        fontFamily: 'Roboto',
        fontSize: 36,
        fontWeight: 700,
        marginTop: '5%',
        fontStyle: 'italic',
    },
    optionsContainer: {
        position: 'absolute',
        top: '8%',
        right: 0,
        zIndex: 500,
        backgroundColor: '#121325',
        borderTopWidth: 1,
        borderTopColor: '#010214',
    },
    optionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#232436',
        padding: 16,
        gap: 4,
    },
    optionText: {
        color: '#ffffffc0',
        fontSize: 20,
    },
    buttonContainer: {
        width: '100%',
        aspectRatio: 3,
        overflow: 'hidden',
    },
    textContainer: {
        width: '100%',
        height: '100%',
        padding: '2%',
        justifyContent: 'flex-end',
        backgroundColor: '#00000050',
    },
    deckTitle: {
        fontSize: Math.max(24, deviceWidth * 0.0277),
        fontWeight: 700,
        color: '#fff',
        textShadowColor: '#000',
        textShadowOffset: {height: 2, width: 2},
        textShadowRadius: 1,
    },
    numCards: {
        fontSize: Math.max(16, deviceWidth * 0.0185),
        fontWeight: 700,
        color: '#fff',
        textShadowColor: '#000',
        textShadowOffset: {height: 1, width: 1},
        textShadowRadius: 1,
    },
    cardImg: {
        width: '100%',
        aspectRatio: 1,
        position: 'absolute',
    },
    placeholderImg: {
        width: deviceWidth,
        height: deviceWidth,
        position: 'absolute',
    },
    scannerContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        position: 'absolute',
        zIndex: 600,
    },
    cameraBlackFrame: {
        backgroundColor: '#000',
        width: '100%',
        height: (deviceHeight - deviceWidth) / 2,
    },
    cameraContainer: {
        width: '100%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    qrFrameContainer: {
        width: '65%',
        aspectRatio: 1,
        position: 'absolute',
        zIndex: 700,
        top: '17.5%',
        left: '17.5%',
    },
    qrFrame: {
       height: '100%',
       aspectRatio: 1,
    },
    errorContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 600,
        backgroundColor: '#000000c0',
    },
    errorFrame: {
        width: '80%',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#24242e',
    },
    errorTitle: {
        fontSize: 22,
        fontFamily: 'Roboto',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: 24,
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        fontWeight: 600,
        color: '#ffffff',
        marginBottom: 24,
    },
    errorDismiss: {
        alignSelf: 'flex-end',
        justifyContent: 'center',
    },
    errorOkay: {
        fontSize: 18,
        fontFamily: 'Roboto',
        textAlign: 'center',
        color: '#ffdd00',
    },
});

export default DeckExplorerScreen;

/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, FlatList, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { pickSingle } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import Header from '../Components/header';

const deviceWidth = Dimensions.get('window').width;

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
            } catch (e) {
                errorMessage.current = 'There was an error while retrieving your decks. Please go back and try again.';
                setShowMessage(true);
            }
        };

        if (isFocused) {
            getDecks();
        }
    }, [isFocused]);

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
        const response = await fetch(url + '/raw', {
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
            errorMessage.current = 'There was an error while reading the QR code. It may be a dead or an invalid link. Please check it out and try again';
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
                                <Image style={[item.img ? styles.cardImg : styles.placeholderImg, {top: item.imgZone ? -(item.imgZone).toString() + '%' : '-100%'}]}
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
                    <View style={styles.cameraContainer}>
                        <QRCodeScanner
                        onRead={(e) => loadQR(e.data)}
                        flashMode={RNCamera.Constants.FlashMode.auto}/>
                    </View>
                    <TouchableOpacity onPress={() => setShowScanner(false)} style={{opacity: 0.75}} activeOpacity={1}>
                            <Icon color="#ffffff" name="close-o" size={deviceWidth * 0.12} type="evilicon"/>
                    </TouchableOpacity>
                </View>
                }
                {
                showMessage &&
                <View style={styles.errorContainer}>
                    <View style={styles.errorFrame}>
                        <Text style={styles.errorTitle}>{errorTitle.current}</Text>
                        <Text style={styles.errorText}>{errorMessage.current}</Text>
                        <TouchableOpacity style={styles.errorDismiss} onPress={() => setShowMessage(false)}>
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
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        position: 'absolute',
        zIndex: 600,
    },
    cameraContainer: {
        width: '100%',
        aspectRatio: 1,
        justifyContent: 'center',
        overflow: 'hidden',
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

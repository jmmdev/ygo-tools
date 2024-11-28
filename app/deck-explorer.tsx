/* eslint-disable react-native/no-inline-styles */
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { pickSingle, isCancel } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { URL } from 'react-native-url-polyfill';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';

import { Header } from '@/components/Header';
import { Prompt } from '@/components/Prompt';

const dimensions = Dimensions.get('window');
const deviceWidth = dimensions.width;
const deviceHeight = dimensions.height;

export default function DeckExplorer() {
    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    const bg = require('../assets/images/bg.png');
    const empty = require('../assets/images/no-deck-found.png');
    const placeholderImg = require('../assets/images/placeholder-crop.png');


    const [decks, setDecks] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const errorMessage = useRef('');

    const isFocused = useIsFocused();

    const params = useLocalSearchParams(); 

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
                    setDecks(JSON.parse(value).sort((a:any, b:any) => a.name.localeCompare(b.name)));
                }
                if (typeof params.deckWasInvalid === "number" && params.deckWasInvalid === 1) {
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
    }, [isFocused]);

    const ydkIsValid = (content: string) => {
        const lines = content.split('\n');
        
        let mainTagCount = 0,
            extraTagCount = 0,
            sideTagCount = 0,
            lastCardChecked = "",
            copyCount = 0;

        for (let line of lines) {
            if (line.length > 0) {
                switch (line){
                    case "#main":
                        mainTagCount++;
                        break;
                    case "#extra":
                        extraTagCount++;
                        break;
                    case "!side":
                        sideTagCount++;
                        break;
                    default:
                        if (line.match(/^\d+$/)) {
                            if (lastCardChecked === line) {
                                copyCount++;
                                if (copyCount > 3)
                                    return false;
                            } else {
                                copyCount = 1;
                                lastCardChecked = line;
                            }
                        }
                    break;
                }
            }

            return mainTagCount === 1 && (extraTagCount === 0 || extraTagCount === 1) && (sideTagCount === 0 || sideTagCount === 1);
        }
    }

    const loadYdk = () => {
        pickSingle({
            type: 'application/octet-stream',
        }).then((result:any) => {
                const path = result.uri;
                RNFS.readFile(path, 'utf8')
                .then(content => {
                    if (!ydkIsValid(content)) {
                        errorMessage.current = "Your file has an invalid deck format, please check it out and try again."
                        setShowMessage(true);
                        return;
                    }

                    const deck = {name: result.name, content: content, img: null};
                    router.navigate({pathname: 'deck-viewer', params: {deck: JSON.stringify(deck), new: 1}});
                })
                .catch(e => {
                    errorMessage.current = 'There was an error while processing your file. Please try again';
                    setShowMessage(true);
                })
        })
        .catch(e => {
            if (!isCancel(e)) {
                errorMessage.current = 'There was an error while processing your file. Please try again';
                setShowMessage(true);
            }
        });
    };

    function generateRandomName() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    const loadQR = async (url:string) => {
        const myUrl = new URL(url);

        const pathNameRoutes = (myUrl.pathname.split('/')).filter((str:string) => str !== '');

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
                    'rentry-auth': `${process.env.EXPO_PUBLIC_AUTH_CODE}`,
                },
            });
            if (response.ok) {
                const paste_content = await response.text();
                const deck = {name: 'deck-' + generateRandomName(), content: paste_content, img: null};
                router.navigate({pathname: 'deck-viewer', params: {deck: JSON.stringify(deck), new: 1}});
            } else {
                errorMessage.current = 'There was an error while processing your request. Possible dead link in QR code.\n\nPlease check it out and try again';
                setShowMessage(true);
            }
        }
        else {
            errorMessage.current = 'There was an error with the QR code. It may be an invalid link.\n\nPlease check it out and try again';
            setShowMessage(true);
        }
        setShowScanner(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg} resizeMode={'cover'}>
                <Header title={'Deck Explorer'}
                firstIcon={'folder-open-outline'} firstSize={deviceWidth * 0.06} firstFunction={() => loadYdk()}
                secondIcon={'scan-sharp'} secondSize={deviceWidth * 0.06} secondFunction={() => setShowScanner(true)}
                thirdIcon={'plus'} thirdSize={deviceWidth * 0.07} thirdFunction={() => router.navigate({pathname: 'deck-viewer', params: {new: 1}})}/>
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
                    keyExtractor={(item:any, index:number) => item.name + index}
                    renderItem={({item}) =>
                        <View>
                            <TouchableOpacity style={styles.buttonContainer}
                            onPress={() => {
                                router.navigate({pathname: 'deck-viewer', params: {deck: JSON.stringify(item), new: 0}});
                            }
                            }>
                                <Image style={[item.img ? styles.cardImg : styles.placeholderImg, {top: item.imgZone ? -((deviceWidth / 3) * item.imgZone / 100) : 0}]}
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
                            <Image style={styles.qrFrame} source={require('../assets/images/qr-scan-frame.png')} />
                        </View>
                        <QRCodeScanner
                        onRead={(e:any) => loadQR(e.data)}
                        flashMode={RNCamera.Constants.FlashMode.auto}/>
                    </View>
                    <View style={[styles.cameraBlackFrame, {padding: 32, alignItems: 'center'}]}>
                        <TouchableOpacity onPress={() => setShowScanner(false)}>
                            <Icon color="#ffffffc0" name="highlight-off" size={Math.min(deviceWidth * 0.15, 48)} type="material"/>
                        </TouchableOpacity>
                    </View>
                </View>
                }
                {
                showMessage &&
                <Prompt description={errorMessage.current} type={'ok'}
                    okAction={() => {
                        setShowMessage(false);
                    }}/>
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
        backgroundColor: '#232436',
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
        fontFamily: 'Roboto-700',
        fontSize: 36,
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
        fontFamily: 'Roboto-700',
        color: '#fff',
        textShadowColor: '#000',
        textShadowOffset: {height: 2, width: 2},
        textShadowRadius: 1,
    },
    numCards: {
        fontSize: Math.max(16, deviceWidth * 0.0185),
        fontFamily: 'Roboto-700',
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
        height: Math.floor((deviceHeight - deviceWidth) / 2),
    },
    cameraContainer: {
        width: '100%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    qrFrameContainer: {
        width: Math.min(deviceWidth * 0.65, 300),
        maxWidth: 500,
        aspectRatio: 1,
        position: 'absolute',
        zIndex: 700,
        top: '50%',
        left: '50%',
        transform: [{translateX: -(Math.min(deviceWidth * 0.65, 300)/2)}, {translateY: -(Math.min(deviceWidth * 0.65, 300)/2)}],
    },
    qrFrame: {
       height: '100%',
       aspectRatio: 1,
    },
});

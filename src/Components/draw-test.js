/* eslint-disable react-native/no-inline-styles */
import { Switch } from '@rneui/base';
import { Icon } from '@rneui/themed';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DrawTest = ({deck, setDrawTest}) => {
    const slideAnim = useRef(new Animated.Value(Dimensions.get('screen').height)).current;
    const bg = require('../../assets/bg.png');

    const [deckData, setDeckData] = useState(null);
    const [initialHand, setInitialHand] = useState(null);
    const [actualDeck, setActualDeck] = useState(null);
    const [canDraw, setCanDraw] = useState(true);
    const [showNextDraw, setShowNextDraw] = useState(false);

    const additionalDraws = useRef([]);
    const scrollView = useRef(null);

    useEffect(() => {
        const backAction = () => {
            setDrawTest(false);
            return true;
        };

          const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
          );
          return () => backHandler.remove();
    }, [setDrawTest]);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }).start();
      }, [slideAnim]);

    useEffect(() => {
        if (deck) {
            setDeckData(deck);
        }
    }, [deck]);

    useEffect(() => {
        if (deckData) {
            const cards = [];
            for (let c of deckData) {
                for (let i = 1; i <= c.quantity; i++) {
                    cards.push(c.card.card_images[0].image_url);
                }
            }
            doShuffleDeck(cards);
            setInitialHand(cards.slice(0, 5));
            setActualDeck(cards.slice(5, cards.length));
        }
    }, [deckData]);

    const initializeDeck = () => {
        if (deckData) {
            const cards = [];
            for (let c of deckData) {
                for (let i = 1; i <= c.quantity; i++) {
                    cards.push(c.card.card_images[0].image_url);
                }
            }
            additionalDraws.current = [];
            doShuffleDeck(cards);
            setInitialHand(cards.slice(0, 5));
            setActualDeck(cards.slice(5, cards.length));
            setCanDraw(true);
        }
    };

    const doShuffleDeck = (myDeck) => {
        let currentIndex = myDeck.length;
        let randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [myDeck[currentIndex], myDeck[randomIndex]] = [
            myDeck[randomIndex], myDeck[currentIndex]];
        }
        return myDeck;
    };

    const draw = () => {
        if (actualDeck.length > 0) {
            additionalDraws.current.push(actualDeck[0]);
            const updatedDeck = [...actualDeck];
            updatedDeck.splice(0, 1);

            setCanDraw(updatedDeck.length > 0);
            setActualDeck(updatedDeck);
        }
    };

    return (
        <Animated.View style={[styles.drawsContainer, {top: slideAnim}]}>
            <ImageBackground style={styles.image} source={bg} resizeMode={'cover'}>
                <TouchableOpacity style={styles.close} onPress={() => setDrawTest(false)}>
                    <Icon name="close" type="material-community" size={Dimensions.get('window').width * 0.08} color="#ffffffc0" />
                </TouchableOpacity>
                <View style={{height: '92%', padding: '5%'}}>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={styles.initialText}>Initial hand</Text>
                        </View>
                        <View style={styles.initialHand}>
                            {
                                initialHand &&
                                initialHand.map((img, index) => {
                                    return (
                                        <Image style={styles.cardImage} key={img + index} source={{uri: img}}/>
                                    );
                                })
                            }
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <Text style={styles.drawText}>Draw board</Text>
                            {actualDeck && actualDeck.length > 0 &&
                            <View style={[styles.switchContainer]}>
                                <Text style={styles.switchText}>Show next draw</Text>
                                <Switch thumbColor={showNextDraw ? '#fff' : '#999'} trackColor={{true: '#0c6', false: '#555'}}
                                onValueChange={() => setShowNextDraw(!showNextDraw)}value={showNextDraw} />
                            </View>
                            }
                        </View>
                        <View style={styles.nextDraws}>
                            <ScrollView ref={scrollView} en persistentScrollbar={true} onContentSizeChange={() => scrollView.current.scrollToEnd({animated: false})} contentContainerStyle={styles.nextDrawsContent}>
                                {actualDeck &&
                                    additionalDraws.current.map((img, index) => {
                                        return (
                                            <Image style={styles.cardImage} key={img + index} source={{uri: img}}/>
                                        );
                                    })
                                }
                                {actualDeck && actualDeck.length > 0 && !showNextDraw &&
                                    <Image style={styles.nextDrawImage} source={require('../../assets/my-card.png')}/>
                                }
                                {actualDeck && actualDeck.length > 0 && showNextDraw &&
                                    <Image style={[styles.cardImage, {opacity: 0.5}]} source={{uri: actualDeck[0]}}/>
                                }
                            </ScrollView>
                        </View>
                </View>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.button} onPress={() => initializeDeck()}>
                        <Text style={styles.buttonText}>RESET</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {opacity: actualDeck && actualDeck.length > 1 ? 1 : 0.5}]} disabled={!(actualDeck && actualDeck.length > 1)} onPress={() => {
                        let deckToShuffle = [...actualDeck];
                        doShuffleDeck(deckToShuffle);
                        setActualDeck(deckToShuffle);
                    }}>
                        <Text style={styles.buttonText}>SHUFFLE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {opacity: actualDeck && canDraw ? 1 : 0.5}]} disabled={!(actualDeck && canDraw)} onPress={() => draw()}>
                        <Text style={styles.buttonText}>DRAW</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </Animated.View>
    );
};

const dimensions = Dimensions.get('window');
const deviceWidth = dimensions.width;
const cardHeight = Math.floor((dimensions.width - 12) * 0.8 * 0.2 / 0.686);

const styles = StyleSheet.create({
    drawsContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 600,
    },
    image: {
        height: '100%',
    },
    close: {
        position: 'absolute',
        top: 8,
        right: '5%',
        zIndex: 700,
    },
    initialText: {
        fontSize: 17,
        color: '#fff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#0f6',
        backgroundColor: '#0a090e',
        borderBottomWidth: 0,
    },
    initialHand: {
        alignItems: 'center',
        padding: '5%',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#0f6',
        marginBottom: '10%',
        backgroundColor: '#0a090e',
        gap: 3,
    },
    drawText: {
        fontSize: 17,
        color: '#fff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#fc0',
        backgroundColor: '#0a090e',
        borderBottomWidth: 0,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: deviceWidth * 0.01,
    },
    switchText: {
        fontSize: 16,
        color: '#fff',
    },
    nextDraws: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#fc0',
        overflow: 'hidden',
        backgroundColor: '#0a090e',
    },
    nextDrawsContent: {
        padding: '5%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
    },
    cardImage: {
        height: cardHeight,
        aspectRatio: 0.686,
    },
    nextDrawImage: {
        width: cardHeight * 0.686,
        aspectRatio: 0.686,
        opacity: 0.85,
    },
    footer: {
        width: '100%',
        height: '8%',
        flexDirection: 'row',
        backgroundColor: '#0a090e',
        position: 'absolute',
        zIndex: 700,
        bottom: 0,
        left: 0,
        gap: 2,
    },
    button: {
        width: Math.ceil(Dimensions.get('window').width - 6) * 0.3333,
        height: '100%',
        backgroundColor: '#232336',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 20,
        color: '#ffffff80',
    },
    wait: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000000c0',
        zIndex: 500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waitText: {
        fontFamily: 'Roboto',
        fontSize: 32,
        color: '#ffffff',
        marginTop: '5%',
    },
});

export default DrawTest;

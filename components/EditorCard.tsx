import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, Text, TouchableOpacity, View } from 'react-native';
import { useFonts } from 'expo-font';

export function EditorCard({name, img, quantity, deckIndex, cardIndex, showCardRemovalMessage, updateDeckSize, canAddCopies}:
    {name: string, img: string, quantity: number, deckIndex: number, cardIndex: number, showCardRemovalMessage: any, updateDeckSize: any, canAddCopies: boolean}) {

    const [loaded, error] = useFonts({
        'Roboto-800': require('../assets/fonts/Roboto-800.ttf'),
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    const [actualQuantity, setActualQuantity] = useState(0);

    useEffect(() => {
        setActualQuantity(quantity);
    }, [quantity]);

    return (
        <View key={deckIndex + cardIndex} style={styles.cardContainer}>
            <Image style={styles.cardImage} source={{uri: img}}/>
            <Text adjustsFontSizeToFit={true} style={styles.cardName}>{name}</Text>
            <View style={styles.cardCounter}>
                <TouchableOpacity disabled={!(actualQuantity >= 1)} style={[styles.counterButton, {opacity: actualQuantity >= 1 ? 1 : 0.5}]} onPress={() => {
                    if (actualQuantity > 1) {
                        setActualQuantity(actualQuantity - 1);
                        updateDeckSize(deckIndex, cardIndex, -1);
                    }
                    else {
                        showCardRemovalMessage(name, deckIndex, cardIndex);
                    }
                }}>
                    <Text adjustsFontSizeToFit={true} style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counter}>{actualQuantity}</Text>
                <TouchableOpacity disabled={!(actualQuantity < 3 && canAddCopies)} style={[styles.counterButton, {opacity: actualQuantity < 3 && canAddCopies ? 1 : 0.5}]} onPress={() => {
                    setActualQuantity(actualQuantity + 1);
                    updateDeckSize(deckIndex, cardIndex, 1);
                }}>
                    <Text adjustsFontSizeToFit={true} style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default EditorCard;

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    cardImage: {
        width: '17%',
        aspectRatio: 0.686,
    },
    cardName: {
        width: '55%',
        fontFamily: 'Roboto',
        fontSize: 20,
        color: '#fff',
    },
    cardCounter: {
        width: '20%',
        fontFamily: 'Roboto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counter: {
        width: '33%',
        fontSize: 24,
        textAlign: 'center',
        color: '#fff',
    },
    counterButton: {
        width: '33%',
        maxWidth: 32,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffffc0',
        borderRadius: 200,
    },
    counterButtonText: {
        fontFamily: 'Roboto-800',
        textAlign: 'center',
        color: '#232436',
        fontSize: 500,
    },
});

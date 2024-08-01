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
                {
                actualQuantity >= 1 &&
                <TouchableOpacity style={styles.counterButton} onPress={() => {
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
                }
                <Text style={styles.counter}>{actualQuantity}</Text>
                {
                actualQuantity < 3 && canAddCopies &&
                <TouchableOpacity style={styles.counterButton} onPress={() => {
                    setActualQuantity(actualQuantity + 1);
                    updateDeckSize(deckIndex, cardIndex, 1);
                }}>
                    <Text adjustsFontSizeToFit={true} style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
                }
            </View>
        </View>
    );
};

export default EditorCard;

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: '3%',
    },
    cardImage: {
        width: '15%',
        aspectRatio: 0.686,
        marginRight: '5%',
    },
    cardName: {
        width: '55%',
        fontSize: 22,
        color: '#fff',
        marginRight: '5%',
    },
    cardCounter: {
        width: '20%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    counter: {
        width: '33%',
        fontSize: 24,
        textAlign: 'center',
        color: '#fff',
    },
    counterButton: {
        width: '33%',
        aspectRatio: 1,
        justifyContent: 'center',
        backgroundColor: '#ffffffc0',
        borderRadius: 200,
    },
    counterButtonText: {
        fontSize: 32,
        fontFamily: 'Roboto-800',
        textAlign: 'center',
        color: '#232436',
    },
});

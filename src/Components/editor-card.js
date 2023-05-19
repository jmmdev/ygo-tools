import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EditorCard = ({name, img, quantity, deckIndex, cardIndex, showCardRemovalMessage, updateDeckSize, canAddCopies}) => {

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
        fontWeight: 800,
        textAlign: 'center',
        color: '#232436',
    },
});

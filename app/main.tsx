import { Dimensions, Image, ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MainScreenButton } from '@/components/MainScreenButton';

export default function Main() {
  const bg = require('../assets/images/bg.png');
  const historyImg = require('../assets/images/history.png');

  const card = require('../assets/images/card.png');
  const deck = require('../assets/images/deck.png');
  const collection = require('../assets/images/collection.png');

  return (
    <View style={styles.container}>
        <ImageBackground style={styles.image} source={bg} resizeMode='cover'>
            <View style={styles.mainContainer}>
                <View style={{width: '35%', maxWidth: 200, aspectRatio: 1.307}} />
                <View style={styles.mainButtonsContainer}>
                    <MainScreenButton pathname="card-search" source={card} buttonText={'Card\nSearch'} />
                    <MainScreenButton pathname="deck-explorer" params={{deckWasInvalid: 0}} source={deck} buttonText={'Deck\nExplorer'} />
                    <MainScreenButton pathname="my-collection" source={collection} buttonText={'My\nCollection'} />
                </View>
                <TouchableOpacity onPress={() => router.navigate('/card-list')} style={styles.historyButton}>
                    <Image style={styles.historyImg} source={historyImg} />
                </TouchableOpacity>
            </View>
        </ImageBackground>
    </View>
  );
}

const deviceWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
    },
    image: {
        height: '100%',
    },
    mainContainer: {
        width: '100%',
        height: '100%',
        paddingVertical: '5%',
        justifyContent: 'space-between',
    },
    mainButtonsContainer: {
        gap: deviceWidth * 0.03,
        alignSelf: 'center',
    },
    historyButton: {
        width: '35%',
        maxWidth: 200,
        flexDirection: 'row',
        alignSelf: 'center',
    },
    historyImg: {
        width: '100%',
        aspectRatio: 1.307,
    },
});
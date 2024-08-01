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
            <View style={styles.mainButtonsContainer}>
                <MainScreenButton pathname="card-search" source={card} buttonText={'Card\nSearch'} />
                <MainScreenButton pathname="deck-explorer" params={{deckWasInvalid: 0}} source={deck} buttonText={'Deck\nExplorer'} />
                <MainScreenButton pathname="my-collection" source={collection} buttonText={'My\nCollection'} />
            </View>
            <View style={styles.historyButtonContainer}>
                <TouchableOpacity onPress={() => router.navigate('/card-list')} style={styles.historyButton}>
                    <Image style={styles.historyImg} source={historyImg} />
                </TouchableOpacity>
            </View>
        </ImageBackground>
    </View>
  );
}

const deviceWidth = Dimensions.get('window').width;
const imageHeight = Math.ceil(deviceWidth / 3.75);
const deviceHeight = Dimensions.get('window').height;
const mainButtonsContainerGap = Math.max(deviceHeight * 0.02, 16);
const mainButtonsContainerHeight = 2 * mainButtonsContainerGap + imageHeight * 3;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    image: {
        height: '100%',
        justifyContent: 'flex-end',
    },
    mainButtonsContainer: {
        height: mainButtonsContainerHeight,
        gap: mainButtonsContainerGap,
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
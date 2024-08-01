import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';

const deviceWidth = Dimensions.get('window').width;
const imageHeight = Math.ceil(deviceWidth / 3.75);

export function MainScreenButton({pathname, params, source, buttonText}:{pathname: string, params?: any, source: any, buttonText: string}) {
    const [loaded, error] = useFonts({
        'Matrix-II-Bold': require('../assets/fonts/Matrix-II-Bold.ttf'),
    });

    return (
        <View style={styles.mainButtonBg}>
            <TouchableOpacity style={styles.mainButton}
             onPress={() => router.navigate({pathname: pathname, params: params})}>
                <ImageBackground style={{width: deviceWidth, height: imageHeight, justifyContent: 'center'}} source={source}>
                    <Text adjustsFontSizeToFit={true} style={styles.mainButtonText}>{buttonText}</Text>
                </ImageBackground>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    mainButtonBg: {
        width: '100%',
    },
    mainButton: {
        width: '100%',
    },
    mainButtonText: {
        maxWidth: '50%',
        maxHeight: '75%',
        fontFamily: 'Matrix-II-Bold',
        color: '#fff',
        fontSize: deviceWidth * 0.09,
        padding: 0,
        letterSpacing: 4,
        marginHorizontal: '5%',
    },
})
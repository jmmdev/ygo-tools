import {router} from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, PixelRatio, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@rneui/themed';
import { Header } from '@/components/Header';
import { SearchCardName } from '@/components/SearchCardName';

const deviceWidth = Dimensions.get('window').width;

export default function CardSearch() {
    const [enterCode, setEnterCode] = useState(false);
    const [codeText, setCodeText] = useState('');
    const [wrongCodeFormat, setWrongCodeFormat] = useState(false);
    const [enterName, setEnterName] = useState(false);

    const bgImg = require('../assets/images/bg.png');

    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
    });

    useEffect(() => {
        setEnterCode(false);
        setCodeText('');
    }, []);

    const checkText = (txt: string) => {
        setWrongCodeFormat(!(/^\d+$/.test(txt) && txt.length > 6 && txt.length < 9));
        setCodeText(txt);
    };

    const showCardInfo = (item: any, lg: string) => {
        router.navigate({pathname: 'card-info', params: {id: item.id.toString(), language: lg}});
    };

    const filterSearch = (card: any) => {
        let result = false;

        const frame = card.frameType.toLowerCase();
        result = frame !== 'skill' && frame !== 'token';

        return result;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground source={bgImg} resizeMode="cover" style={styles.image}>
                {
                !enterName &&
                <Header title="Card Search" />
                }
                {
                enterName &&
                <SearchCardName cardSelectionFunction={showCardInfo} showEnterNameFunction={setEnterName} cardElementIcon="open-in-new" cardSearchFilter={filterSearch}/>
                }
                {enterCode &&
                <SafeAreaView style={styles.codeInputForm}>
                    <TextInput style={styles.codeInput} onChangeText={(txt) => checkText(txt)} value={codeText} keyboardType={'number-pad'} selectionColor={'#ffffff50'} autoFocus={true}/>
                    <View style={styles.codeInputButtons}>
                        <TouchableOpacity disabled={wrongCodeFormat || codeText.length <= 0} onPress={() => router.navigate({pathname: 'card-info', params: {id: Number(codeText).toString()}})} style={[styles.inputButton,{opacity: wrongCodeFormat || codeText.length <= 0 ? 0.4 : 1}]}>
                            <Text style={styles.inputButtonText}>Submit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            setEnterCode(false);
                            setCodeText('');
                        }
                        } style={styles.inputButton}>
                            <Text style={styles.inputButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>}
                {!enterCode && !enterName &&
                <>
                    <SafeAreaView style={styles.buttonContainer}>
                        <View style={styles.buttonBackground}>
                            <Text style={[styles.buttonText, {color: '#13131d'}]} adjustsFontSizeToFit numberOfLines={1}>Search by name</Text>
                            <TouchableOpacity onPress={() => setEnterName(true)} style={styles.button} activeOpacity={0}>
                                <Text style={styles.buttonText} adjustsFontSizeToFit numberOfLines={1}>Search by name</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonBackground}>
                            <Text style={[styles.buttonText, {color: '#13131d'}]} adjustsFontSizeToFit numberOfLines={1}>Search by ID</Text>
                            <TouchableOpacity onPress={() => setEnterCode(true)} style={styles.button} activeOpacity={0}>
                                <Text style={styles.buttonText} adjustsFontSizeToFit numberOfLines={1}>Search by ID</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </>}
            </ImageBackground>
        </SafeAreaView>
    );
}

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
    codeInputForm: {
        flex: 1,
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeInput: {
        width: '70%',
        marginBottom: '5%',
        backgroundColor: '#2a2a40',
        fontSize: 20,
        padding: '2%',
        color: '#fff',
    },
    codeInputButtons: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '70%',
    },
    inputButton: {
        width: '48%',
        padding: '2%',
        backgroundColor: '#13131d',
        borderRadius: 3,
        borderWidth: Math.ceil(Dimensions.get('window').width / 400),
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputButtonText: {
        fontFamily: 'Roboto-700',
        fontSize: 20,
        color: '#ffffff',
    },
    buttonContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: deviceWidth * 0.02,
    },
    buttonBackground: {
        position: 'relative',
        width: '70%',
        maxWidth: 220,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderColor: '#fff',
        borderWidth: 2,
    },
    button: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: Math.min(220, deviceWidth * 0.7),
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2,
        backgroundColor: '#13131d',
    },
    buttonText: {
        padding: '2.5%',
        width: "100%",
        color: '#fff',
        fontSize:  24,
        fontFamily: 'Roboto-700',
        textAlign: 'center',
    },
});
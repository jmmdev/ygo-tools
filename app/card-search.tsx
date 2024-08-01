import {router} from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@rneui/themed';
import { Header } from '@/components/Header';
import { SearchCardName } from '@/components/SearchCardName';

export default function CardSearch() {
    const [enterCode, setEnterCode] = useState(false);
    const [codeText, setCodeText] = useState('');
    const [wrongCodeFormat, setWrongCodeFormat] = useState(false);
    const [enterName, setEnterName] = useState(false);

    const deviceWidth = Dimensions.get('window').width;

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
                        <TouchableOpacity onPress={() => setEnterName(true)} style={styles.button} activeOpacity={0.5}>
                            <Icon color="#ffffff" name="text-search" size={deviceWidth * 0.07} type="material-community" />
                            <Text style={styles.buttonText}>Search by name</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEnterCode(true)} style={styles.button} activeOpacity={0.5}>
                            <Icon color="#ffffff" name="form-textbox" size={deviceWidth * 0.07} type="material-community" />
                            <Text style={styles.buttonText}>Search by ID</Text>
                        </TouchableOpacity>
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
        height: Math.max(48, Dimensions.get('window').height * 0.06),
        marginBottom: '5%',
        backgroundColor: '#2a2a40',
        fontSize: 24,
        padding: 0,
        paddingLeft: '4%',
        color: '#fff',
    },
    codeInputButtons: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '70%',
        height: Math.max(48, Dimensions.get('window').height * 0.06),
    },
    inputButton: {
        width: '48%',
        height: '100%',
        backgroundColor: '#13131d',
        borderRadius: 3,
        borderWidth: Math.ceil(Dimensions.get('window').width / 400),
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputButtonText: {
        fontFamily: 'Roboto-700',
        fontSize: Math.min(24, Dimensions.get('window').width * 0.06),
        color: '#ffffff',
    },
    buttonContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Dimensions.get('window').height * 0.01,
    },
    button: {
        padding: '5%',
        display: 'flex',
        width: '70%',
        maxWidth: 500,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        borderColor: '#ffffff',
        borderWidth: Math.ceil(Dimensions.get('window').width / 400),
        backgroundColor: '#13131d',
    },
    buttonText: {
        color: '#ffffff',
        fontFamily: 'Roboto-700',
        fontSize: Math.min(24, Dimensions.get('window').width * 0.06),
        marginLeft: '5%',
    },
});
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Icon } from '@rneui/themed';
import SearchCardName from '../Components/search-card-name.js';
import Header from '../Components/header';

const CardSearchScreen = ({navigation, route}) => {

    const [enterCode, setEnterCode] = useState(false);
    const [codeText, setCodeText] = useState('');
    const [wrongCodeFormat, setWrongCodeFormat] = useState(false);
    const [enterName, setEnterName] = useState(false);

    const deviceWidth = Dimensions.get('window').width;

    const bgImg = require('../../assets/bg.png');

    useEffect(() => {
        setEnterCode(false);
        setCodeText('');
    }, []);

    const checkText = (txt) => {
        setWrongCodeFormat(!(/^\d+$/.test(txt) && txt.length > 6 && txt.length < 9));
        setCodeText(txt);
    };

    const showCardInfo = (item, lg) => {
        navigation.navigate('CardInfo', {id: item.id.toString(), language: lg});
    };

    const filterSearch = (card) => {
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
                <Header navigation={navigation} title={'Card Search'} />
                }
                {
                enterName &&
                <SearchCardName cardSelectionFunction={showCardInfo} showEnterNameFunction={setEnterName} cardElementIcon="open-in-new" cardSearchFilter={filterSearch}/>
                }
                {enterCode &&
                <SafeAreaView style={styles.codeInputForm}>
                    <TextInput style={styles.codeInput} onChangeText={(txt) => checkText(txt)} value={codeText} keyboardType={'number-pad'} selectionColor={'#ffffff50'} autoFocus={true}/>
                    <View style={styles.codeInputButtons}>
                        <TouchableOpacity onPress={() => navigation.navigate('CardInfo', {id: Number(codeText).toString()})} style={[styles.inputButton,{opacity: wrongCodeFormat || codeText.length <= 0 ? 0.4 : 1}]} disabled={codeText.length <= 0 || wrongCodeFormat}>
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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
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
        fontFamily: 'Roboto',
        fontSize: Math.min(24, Dimensions.get('window').width * 0.06),
        color: '#ffffff',
        fontWeight: 700,
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
        fontFamily: 'Roboto',
        fontSize: Math.min(24, Dimensions.get('window').width * 0.06),
        marginLeft: '5%',
        fontWeight: 700,
    },
});

export default CardSearchScreen;

/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../Components/header.js';

const deviceWidth = Dimensions.get('window').width;

const SettingsScreen = ({navigation, route}) => {
    const [settingsChanged, setSettingsChanged] = useState(false);
    const [pickedLanguage, setPickedLanguage] = useState('en');
    const [showLanguages, setShowLanguages] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saveEnded, setSaveEnded] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await AsyncStorage.getItem('settings');
                if (settings != null) {
                    setPickedLanguage(JSON.parse(settings).language);
                }
            } catch (e) {
                console.log(e);
            }
        };
        loadSettings();
    }, []);

    const saveSettings = async () => {
        try {
            setSaveEnded(false);
            const newSettings = {
                language: pickedLanguage,
            };
            await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
            updateCardTranslations();
            setSettingsChanged(false);
        } catch (e) {
            console.log(e);
        }
    };

    const updateCardTranslations = async () => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const keys = allKeys.filter(key => !isNaN(Number(key)));
            if (keys != null) {
                const result = await AsyncStorage.multiGet(keys);
                if (result != null) {
                    const cards = extractValues(result);

                    for (let card of cards) {
                        if (!(pickedLanguage in card.name[0])) {
                            fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + card.id + (pickedLanguage !== 'en' ? ('&language=' + pickedLanguage) : '')).then(cardInfo => {
                                if (cardInfo.ok) {
                                    cardInfo.json().then(translation => {
                                        try {
                                            let translations = (JSON.stringify(card.desc[0])).slice(0, -1);
                                            let names = (JSON.stringify(card.name[0])).slice(0, -1);

                                            const desc = JSON.stringify(translation.data[0].desc);
                                            const name = JSON.stringify(translation.data[0].name);

                                            translations += ', "' + pickedLanguage + '":' + desc + '}';
                                            names += ', "' + pickedLanguage + '":' + name + '}';
                                            card.desc[0] = JSON.parse(translations);
                                            card.name[0] = JSON.parse(names);

                                            AsyncStorage.setItem(card.id.toString(), JSON.stringify(card)).then();
                                        } catch (e) {
                                            console.log(e);
                                        }
                                    });
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                        }
                    }
                    setTimeout(() => {
                        setSaveEnded(true);
                    }, 1000);
                }
            }
        } catch (e) {
            console.log(e);
        }
    };

    const extractValues = (pairs) => {
        let res = [];
        for (let pair of pairs) {
            const value = JSON.parse(pair[1]);
            res.push(value);
        }
        return res;
    };

    const pickLanguage = (item) => {
        if (item.code !== pickedLanguage) {
            setPickedLanguage(item.code);
            setShowLanguages(false);
            setSettingsChanged(true);
        }
    };

    const checkGoBack = () => {
        if (settingsChanged) {
            setShowConfirm(true);
        } else {
            navigation.goBack();
        }
    };

    const LANGUAGES = [
        {code: 'en', img: require('../../assets/en.png'), lg: 'US English'},
        {code: 'fr', img: require('../../assets/fr.png'), lg: 'Français'},
        {code: 'de', img: require('../../assets/de.png'), lg: 'Deutsch'},
        {code: 'it', img: require('../../assets/it.png'), lg: 'Italiano'},
        {code: 'pt', img: require('../../assets/pt.png'), lg: 'Português'},
    ];

    const FIELDS = [
        {
            tag: 'Language',
            icon: 'language',
            type: 'material',
            description: 'Sets the prefered language for some tools such as searching cards by name or getting automatic card translations',
            onPress: () => setShowLanguages(true)},
    ];

    return (
        <SafeAreaView style={{flex: 1}}>
            {!saveEnded &&
            <View style={styles.saving}>
                <ActivityIndicator color={'#ffffffb0'} size={64}/>
                <Text style={styles.savingText}>Saving...</Text>
            </View>}
            <Header navigation={navigation} title={'Settings'} goBackFunction={() => checkGoBack()} firstIcon={'content-save'}
            firstSize={deviceWidth * 0.08} firstFunction={() => saveSettings()} firstDisabled={!settingsChanged}
            firstStyle={{opacity: settingsChanged ? 1 : 0.5, backgroundColor: settingsChanged ? '#0c6' : 'transparent'}} />
            {
            showConfirm &&
            <View style={styles.confirmContainer}>
                <View style={styles.confirmFrame}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.confirmTitle}>Warning</Text>
                    </View>
                    <Text style={styles.confirmText}>Do you want to leave? All your unsaved changes will be discarded</Text>
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={styles.confirmButton} onPress={() => setShowConfirm(false)}>
                            <Text style={styles.buttonText}>No</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={() => {
                            setShowConfirm(false);
                            navigation.goBack();
                        }}>
                            <Text style={styles.buttonText}>Yes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            }
            <>
                {showLanguages &&
                <View style={styles.popupContainer}>
                    <View style={styles.languagesPopup}>
                        <View style={styles.popupHeader}>
                            <Text style={styles.popupText}>
                                Select a language
                            </Text>
                            <TouchableOpacity onPress={() => setShowLanguages(false)} style={styles.popupClose}>
                                <Icon color="#ffffff" name="close" size={deviceWidth * 0.07} type="material-community"/>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                        data={LANGUAGES}
                        renderItem={({item, index}) =>
                            <TouchableOpacity style={[styles.languageContainer,{backgroundColor: item.code === pickedLanguage ? '#232436' : 'transparent',
                            borderBottomLeftRadius: index === LANGUAGES.length - 1 ? 10 : 0, borderBottomRightRadius: index === LANGUAGES.length - 1 ? 10 : 0}]}
                                onPress={() => pickLanguage(item)}>
                                <View style={styles.languageIcon}>
                                    <Image source={item.img} style={styles.languageImg}/>
                                </View>
                                <Text style={styles.languageText}>{item.lg}</Text>
                            </TouchableOpacity>
                        }/>
                    </View>
                </View>}
                <FlatList style={styles.container}
                    data={FIELDS}
                    renderItem={({item, index}) =>
                    <View>
                        <TouchableOpacity  onPress={item.onPress}>
                            <View style={styles.field}>
                                <View style={{width: '90%'}}>
                                    <View style={styles.tagTitle}>
                                        <Icon color="#fff" name={item.icon} size={deviceWidth * 0.06} type={item.type} />
                                        <Text style={styles.tagLabel}>{item.tag}</Text>
                                    </View>
                                </View>
                                <View style={{width: '10%'}}>
                                    <Icon color="#fff" name="chevron-right" size={deviceWidth * 0.07} type="material-community" style={{width: '100%'}}/>
                                </View>
                            </View>
                            <Text style={styles.tagDescription}>{item.description}</Text>
                        </TouchableOpacity>
                        <View style={index < FIELDS.length - 1 ? styles.fieldLine : {}}/>
                    </View>
                } />
            </>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    saving: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000000b0',
        zIndex: 500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    savingText: {
        fontFamily: 'Roboto',
        fontSize: 32,
        color: '#ffffffb0',
        marginTop: '5%',
    },
    header: {
        width: '100%',
        height: '8%',
        backgroundColor: '#232436',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: '15%',
        height: '100%',
        marginRight: '5%',
        justifyContent: 'center',
    },
    headerText: {
        width: '80%',
        fontFamily: 'Roboto',
        fontSize: 26,
        color: '#ffffff',
        fontWeight: 700,
    },
    confirmContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000000c0',
        zIndex: 600,
    },
    confirmFrame: {
        width: '80%',
        padding: '5%',
        paddingBottom: 16,
        backgroundColor: '#24242e',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '5%',
    },
    confirmTitle: {
        fontSize: 22,
        fontFamily: 'Roboto',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: '5%',
    },
    confirmText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        fontWeight: 600,
        color: '#ffffff',
        marginBottom: '5%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'flex-end',
        gap: Math.min(100, Dimensions.get('window').width * 0.1),
    },
    confirmButton: {
        alignSelf: 'flex-end',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        textAlign: 'center',
        color: '#ffdd00',
    },
    floatButton: {
        padding: 16,
        aspectRatio: 1,
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 200,
        zIndex: 100,
    },
    popupContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000c0',
        position: 'absolute',
        zIndex: 200,
    },
    languagesPopup: {
        width: '80%',
        backgroundColor: '#13131d',
        paddingTop: 0,
        borderRadius: 10,
    },
    popupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: '5%',
        marginBottom: '2%',
    },
    popupText: {
        width: '80%',
        fontSize: 22,
        color: '#ffffff',
    },
    popupClose: {
        width: '20%',
        aspectRatio: 1,
        justifyContent: 'center',
    },
    languageContainer: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        padding: '5%',
    },
    languageIcon: {
        width: '15%',
        aspectRatio: 1,
        marginRight: '10%',
    },
    languageImg: {
        height: '100%',
        aspectRatio: 1,
    },
    languageText: {
        fontFamily: 'Roboto',
        color: '#ffffff',
        fontSize: 24,
    },
    container: {
        width: '100%',
        backgroundColor: '#13131d',
    },
    field: {
        flexDirection: 'row',
        padding: '5%',
    },
    tagTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagLabel: {
        fontFamily: 'Roboto',
        fontSize: 24,
        fontWeight: 700,
        color: '#ffffffd0',
        marginLeft: '4%',
    },
    tagDescription: {
        fontFamily: 'Roboto',
        fontSize: 16,
        color: '#ffffff80',
        paddingHorizontal: '5%',
    },
    fieldLine: {
        width: '90%',
        marginHorizontal: '5%',
        height: 1,
        backgroundColor: '#ffffff40',
    },
});

export default SettingsScreen;

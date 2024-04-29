/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/themed';
import Header from '../Components/header';
import { useIsFocused } from '@react-navigation/native';

const deviceWidth = Dimensions.get('window').width;

const MyCollectionScreen = ({navigation}) => {

    const bg = require('../../assets/bg.png');

    const [isInfoLoading, setIsInfoLoading] = useState(true);
    const [wait, setWait]  = useState(false);
    const [showAddedSets, setShowAddedSets] = useState(false);

    const collection = useRef(null);
    const actualSets = useRef(null);
    const pageCardList = useRef(null);
    const currentPage = useRef(0);
    const numberOfPages = useRef(0);
    const mySetsList = useRef(null);
    const lastFilter = useRef(null);
    const addedSets = useRef(null);

    const resultsLength = 15;
    const isFocused = useIsFocused();

    useEffect(() => {
            const loadCollection = async () => {
                setIsInfoLoading(true);
                try {
                    const value = await AsyncStorage.getItem('collection');

                    if (value !== null) {
                        const parsedValue = JSON.parse(value);
                        collection.current = parsedValue;
                        actualSets.current = [...collection.current];
                        actualSets.current.sort((a, b) => {
                            return a.set.set_name.localeCompare(b.set.set_name);
                        });

                        if (lastFilter.current) {
                            actualSets.current = actualSets.current.filter(set => set.set.set_name.toLowerCase().includes(lastFilter.current)
                            || set.set.set_code.toLowerCase().includes(lastFilter.current));
                        }

                        pageCardList.current = actualSets.current.slice(currentPage.current * resultsLength, (currentPage.current + 1) * resultsLength < actualSets.current.length ? (currentPage.current + 1) * resultsLength : actualSets.current.length);
                        numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
                        setIsInfoLoading(false);
                    } else {
                        fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')
                            .then(response => {
                                if (response.ok) {
                                    response.json().then(async setsInfo => {
                                        collection.current = [];
                                        for (let set of setsInfo) {
                                            collection.current.push({set: set, cards: []});
                                        }
                                        await AsyncStorage.setItem('collection', JSON.stringify(collection.current));
                                        actualSets.current = [...collection.current];
                                        pageCardList.current = actualSets.current.slice(currentPage.current * resultsLength, (currentPage.current + 1) * resultsLength < actualSets.current.length ? (currentPage.current + 1) * resultsLength : actualSets.current.length);
                                        numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
                                        setIsInfoLoading(false);
                                    });
                                } else {
                                    console.log(response);
                                    setIsInfoLoading(false);
                                }
                            })
                            .catch(e => {
                                console.log('Error', e);
                                setIsInfoLoading(false);
                            });
                    }
                } catch (e) {
                    console.log(e);
                    setIsInfoLoading(false);
                }
            };
            if (isFocused) {
                loadCollection();
            }
    }, [isFocused]);

    const showPage = (page) => {
        if (!wait) {
            setWait(true);
        }
        setTimeout(() => {
            currentPage.current = page;
            pageCardList.current = actualSets.current.slice(page * resultsLength, (page + 1) * resultsLength < actualSets.current.length ? (page + 1) * resultsLength : actualSets.current.length);
            setWait(false);
            if (mySetsList.current) {
                mySetsList.current.scrollTo({animated: false, y: 0});
            }
        }, 1000);
    };

    const showPages = () => {
        const pages = [];
        for (let i = Math.max(0, currentPage.current - 1); i <= Math.min(currentPage.current + 1, numberOfPages.current - 1); i++) {
            pages.push(
                <TouchableHighlight underlayColor={currentPage.current === i ? 'none' : '#090a0d'} key={i} onPress={() => {
                    if (currentPage.current !== i) {
                        showPage(i);
                    }
                }} style={currentPage.current === i ? styles.pageSelected : styles.pageFree}>
                    <Text style={{fontSize: 18, color: currentPage.current === i ? '#090a0d' : '#fff'}}>{i + 1}</Text>
                </TouchableHighlight>
            );
        }
        return pages;
    };

    const filterSets = (text) => {
        setWait(true);
        setTimeout(() => {
            actualSets.current = [...collection.current];
            actualSets.current = actualSets.current.filter(set => set.set.set_name.toLowerCase().includes(text) || set.set.set_code.toLowerCase().includes(text));
            pageCardList.current = actualSets.current.slice(0, resultsLength < actualSets.current.length ? resultsLength : actualSets.current.length);
            numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
            if (lastFilter.current !== text) {
                setLastFilter(text);
            }
            showPage(0);
        }, 1500);
    };

    const setLastFilter = (filter) => {
        lastFilter.current = filter;
    };

    const restoreSets = () => {
        setWait(true);
        setTimeout(() => {
            actualSets.current = [...collection.current];
            pageCardList.current = actualSets.current.slice(0, resultsLength < actualSets.current.length ? resultsLength : actualSets.current.length);
            numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
            setLastFilter(null);

            showPage(0);
        }, 1500);
    };

    const collectionHasSet = (set) => {
        for (let s of collection.current) {
            if (s.set.set_name === set.set_name) {
                return true;
            }
        }
        return false;
    };

    const updateCollection = () => {
        setIsInfoLoading(true);
        fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')
            .then(response => {
                if (response.ok) {
                    response.json().then(async setsInfo => {
                        addedSets.current = [];
                        for (let set of setsInfo) {
                            if (!collectionHasSet(set)) {
                                addedSets.current.push({set: set, cards: []});
                                collection.current.push({set: set, cards: []});
                            }
                        }
                        if (addedSets.current.length > 0) {
                            await AsyncStorage.setItem('collection', JSON.stringify(collection.current));
                            actualSets.current = [...collection.current];
                            pageCardList.current = collection.current.slice(0, resultsLength < actualSets.current.length ? resultsLength : actualSets.current.length);
                            numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
                        }
                        setIsInfoLoading(false);
                        setShowAddedSets(true);
                    });
                } else {
                    console.log(response);
                    setIsInfoLoading(false);
                }
            })
            .catch(e => {
                console.log('Error', e);
                setIsInfoLoading(false);
            });
    };

    const getAddedSets = () => {
        if (addedSets.current.length > 0) {
            let output = '';
            for (let s of addedSets.current) {
                output += s.set.set_name + '\n';
            }
            return output.trim();
        } else {
            return 'No new sets have been added';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg}>
                <Header navigation={navigation} title={'Collection'} canSearch={true} inputSubmitFunction={filterSets}
                inputPlaceHolder={'Enter set name or code'} onHideSearchFunction={() => restoreSets()}
                firstIcon={'refresh'} firstSize={deviceWidth * 0.09} firstFunction={() => updateCollection()}
                thirdIcon={'table-search'} thirdSize={deviceWidth * 0.09} />
                {
                wait &&
                <View style={styles.wait}>
                    <ActivityIndicator color={'#ffffff'} size={64}/>
                    <Text style={styles.waitText}>Please wait...</Text>
                </View>
                }
                {
                isInfoLoading &&
                <View style={styles.loading}>
                    <ActivityIndicator size={120} color={'#ffffffb0'}/>
                </View>
                }
                {showAddedSets &&
                <View style={styles.messageContainer}>
                    <View style={styles.messageFrame}>
                        {addedSets.current && addedSets.current.length > 0 &&
                        <Text style={styles.messageText}>{'The following sets have been added\n'}</Text>
                        }
                        <ScrollView style={{maxHeight: deviceWidth * 0.4}} persistentScrollbar={true}>
                            <Text style={styles.messageText}>{getAddedSets()}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.messageDismiss} onPress={() => {
                                setShowAddedSets(false);
                            }
                        }>
                            <Text style={styles.messageOkay}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                }
                {!isInfoLoading && pageCardList.current && pageCardList.current.length > 0 &&
                <ScrollView ref={mySetsList} contentContainerStyle={styles.setsContent}>
                    <View style={styles.setsContainer}>
                    {
                        pageCardList.current.map((set, index) => {
                            return (
                                <TouchableOpacity key={set.set.set_code + '-' + index} style={styles.setContainer} activeOpacity={0.6}
                                onPress={() => navigation.navigate('SetCards', {set: set, setIndex: collection.current.indexOf(set)})}>
                                    <>
                                        <Image style={styles.setImage} source={set.set.set_image ? {uri: set.set.set_image} : require('../../assets/no-set-image.png')} />
                                        <Text style={styles.setName}>{set.set.set_name}</Text>
                                    </>
                                </TouchableOpacity>
                            );
                        })
                    }
                    </View>
                    <View style={styles.pagesContainer}>
                        {(currentPage.current === 0 && numberOfPages.current === 2 || currentPage.current === 1 && numberOfPages.current > 2) &&
                        <View style={{width: deviceWidth * 0.07}} />
                        }
                        {currentPage.current > 1 &&
                        <TouchableHighlight style={styles.firstAndLastPage} underlayColor={'none'} onPress={() => showPage(0)}>
                            <Icon color="#fff" name="page-first" size={deviceWidth * 0.07} type="material-community"/>
                        </TouchableHighlight>
                        }
                        {showPages()}
                        {
                        currentPage.current < numberOfPages.current - 2 &&
                        <TouchableHighlight style={styles.firstAndLastPage} underlayColor={'none'} onPress={() => showPage(numberOfPages.current - 1)}>
                            <Icon color="#fff" name="page-last" size={deviceWidth * 0.07} type="material-community"/>
                        </TouchableHighlight>
                        }
                        {(currentPage.current === numberOfPages.current - 1 && numberOfPages.current === 2 || currentPage.current === numberOfPages.current - 2 && numberOfPages.current > 2) &&
                        <View style={{width: deviceWidth * 0.07}} />
                        }
                    </View>
                </ScrollView>
                }
                {!isInfoLoading && (!pageCardList.current || !pageCardList.current.length > 0) &&
                    <View style={styles.emptyMsg}>
                        <Image source={require('../../assets/no-set-found.png')} resizeMode="contain" style={{height: '40%'}}/>
                    </View>
                }
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
    },
    image: {
        height: '100%',
    },
    wait: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000000c0',
        zIndex: 600,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waitText: {
        fontFamily: 'Roboto',
        fontSize: 32,
        color: '#ffffff',
        marginTop: '5%',
    },
    loading: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 600,
        backgroundColor: '#000000c0',
    },
    messageFrame: {
        width: '80%',
        padding: '5%',
        paddingTop: '10%',
        backgroundColor: '#24242e',
    },
    messageText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        fontWeight: 600,
        color: '#ffffff',
    },
    messageDismiss: {
        alignSelf: 'flex-end',
        justifyContent: 'center',
        marginTop: deviceWidth * 0.05,
        width: 64,
        height: 32,
    },
    messageOkay: {
        fontSize: 18,
        fontFamily: 'Roboto',
        textAlign: 'center',
        color: '#ffdd00',
    },
    emptyMsg: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '92%',
        opacity: 0.65,
    },
    setsContent: {
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5%',
    },
    setsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    setContainer: {
        maxWidth: (deviceWidth * 0.9 * 0.333 - 8),
        marginBottom: deviceWidth * 0.05,
    },
    setImage: {
        height: (deviceWidth * 0.9 * 0.333 - 8) / 0.635,
        aspectRatio: 0.635,
        marginBottom: deviceWidth * 0.02,
    },
    setName: {
        width: (deviceWidth * 0.9 * 0.333 - 8),
        color: '#fff',
        fontSize: Math.max(16, deviceWidth * 0.02),
        textAlign: 'center',
    },
    pagesContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Math.max(16, Dimensions.get('window').width * 0.03),
        marginVertical: '5%',
    },
    firstAndLastPage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageFree: {
        width: Dimensions.get('window').width * 0.09,
        maxWidth: 56,
        aspectRatio: 1,
        borderRadius: 500,
        borderWidth: 1,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#13131d',
    },
    pageSelected: {
        width: Dimensions.get('window').width * 0.09,
        maxWidth: 56,
        aspectRatio: 1,
        borderRadius: 500,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

export default MyCollectionScreen;

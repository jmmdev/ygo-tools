import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/themed';
import { Header } from '@/components/Header';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import { Prompt } from '@/components/Prompt';

const deviceWidth = Dimensions.get('window').width;

export default function MyCollection() {

    const [loaded, error] = useFonts({
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });


    const bg = require('../assets/images/bg.png');

    const [isInfoLoading, setIsInfoLoading] = useState(true);
    const [wait, setWait]  = useState(false);
    const [showAddedSets, setShowAddedSets] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const initialRef:any = null;
    const mySetsRef = useRef(initialRef);
    const collection = useRef<any[]>([]);
    const actualSets = useRef<any[]>([]);
    const pageCardList = useRef<any[]>([]);
    const addedSets = useRef<any[]>([]);
    const currentPage = useRef(0);
    const numberOfPages = useRef(0);
    const lastFilter = useRef('');
    const errorTitle = useRef('');
    const errorMessage = useRef('');

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

                        if (lastFilter.current) {
                            actualSets.current = actualSets.current.filter((set: any) => set.set.set_name.toLowerCase().includes(lastFilter.current)
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
                                    errorTitle.current = 'Sets fetching error';
                                    errorMessage.current = 'Sets information could not be retrieved. Please try again';
                                    setShowMessage(true);
                                    setIsInfoLoading(false);
                                }
                            })
                            .catch(e => {
                                errorTitle.current = 'Sets fetching error';
                                errorMessage.current = 'Sets information could not be retrieved. Please try again';
                                setShowMessage(true);
                                setIsInfoLoading(false);
                            });
                    }
                } catch (e) {
                    errorTitle.current = 'Collection data fetching error';
                    errorMessage.current = 'Error while retrieving collection information. Please try again';
                    setShowMessage(true);
                    setIsInfoLoading(false);
                }
            };
            if (isFocused) {
                loadCollection();
            }
    }, [isFocused]);

    const showPage = (page:number) => {
        if (!wait) {
            setWait(true);
        }
        setTimeout(() => {
            currentPage.current = page;
            pageCardList.current = actualSets.current.slice(page * resultsLength, (page + 1) * resultsLength < actualSets.current.length ? (page + 1) * resultsLength : actualSets.current.length);
            setWait(false);
            if (mySetsRef.current) {
                mySetsRef.current.scrollTo({animated: false, y: 0});
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

    const filterSets = (text:string) => {
        setWait(true);
        setTimeout(() => {
            actualSets.current = [...collection.current];
            actualSets.current = actualSets.current.filter((set:any) => set.set.set_name.toLowerCase().includes(text) || set.set.set_code.toLowerCase().includes(text));
            pageCardList.current = actualSets.current.slice(0, resultsLength < actualSets.current.length ? resultsLength : actualSets.current.length);
            numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
            if (lastFilter.current !== text) {
                lastFilter.current = text;
            }
            showPage(0);
        }, 1500);
    };

    const restoreSets = () => {
        setWait(true);
        setTimeout(() => {
            actualSets.current = [...collection.current];
            pageCardList.current = actualSets.current.slice(0, resultsLength < actualSets.current.length ? resultsLength : actualSets.current.length);
            numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
            lastFilter.current = '';

            showPage(0);
        }, 1500);
    };

    const collectionHasSet = (set:any) => {
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
                            collection.current.sort((a:any, b:any) => {
                                return a.set.set_name.localeCompare(b.set.set_name);
                            });
                            await AsyncStorage.setItem('collection', JSON.stringify(collection.current));
                            actualSets.current = [...collection.current];
                            pageCardList.current = collection.current.slice(0, resultsLength < actualSets.current.length ? resultsLength : actualSets.current.length);
                            numberOfPages.current = Math.ceil(actualSets.current.length / resultsLength);
                        }
                        setIsInfoLoading(false);
                        setShowAddedSets(true);
                    });
                } else {
                    errorTitle.current = 'Sets fetching error';
                    errorMessage.current = 'Sets information could not be retrieved. Please try again';
                    setShowMessage(true);
                    setIsInfoLoading(false);
                }
            })
            .catch(e => {
                errorTitle.current = 'Sets fetching error';
                errorMessage.current = 'Sets information could not be retrieved. Please try again';
                setShowMessage(true);
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
                <Header title={'Collection'} canSearch={true} inputSubmitFunction={filterSets}
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
                        <View style={styles.upperContent}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>YGO Tools</Text>
                                <Icon color="#ffffffc0" name="info-outline" size={22} type="material" style={{marginLeft: 4}}/>
                            </View>
                            {addedSets.current && addedSets.current.length > 0 &&
                            <Text style={styles.messageText}>{'The following sets have been added\n'}</Text>
                            }
                            <ScrollView style={{maxHeight: deviceWidth * 0.4}} persistentScrollbar={true}>
                                <Text style={styles.messageText}>{getAddedSets()}</Text>
                            </ScrollView>
                        </View>
                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity style={styles.messageDismiss} onPress={() => {
                                setShowAddedSets(false);
                            }
                            }>
                                <Text style={styles.messageOkay}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                }
                {showMessage &&
                    <Prompt description={errorMessage.current} type='ok'
                        okAction={() => {
                            setShowMessage(false);
                            router.back();
                        }} />
                }
                {!isInfoLoading && pageCardList.current && pageCardList.current.length > 0 &&
                <ScrollView ref={mySetsRef} contentContainerStyle={styles.setsContent}>
                    <View style={styles.setsContainer}>
                    {
                        pageCardList.current.map((set:any, index:number) => {
                            return (
                                <TouchableOpacity key={set.set.set_code + '-' + index} style={styles.setContainer} activeOpacity={0.6}
                                onPress={() => router.navigate({pathname: 'set-cards', params: {set: JSON.stringify(set), setIndex: collection.current.indexOf(set)}})}>
                                    <>
                                        <Image style={styles.setImage} source={set.set.set_image ? {uri: set.set.set_image} : require('../assets/images/no-set-image.png')} />
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
                {!isInfoLoading && (!pageCardList.current || !(pageCardList.current.length > 0)) &&
                    <View style={styles.emptyMsg}>
                        <Image source={require('../assets/images/no-set-found.png')} resizeMode="contain" style={{height: '40%'}}/>
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
        backgroundColor: '#232436',
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
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000c',
        zIndex: 600,
    },
    messageFrame: {
        width: '80%',
        backgroundColor: '#24242e',
    },
    upperContent: {
        padding: '5%',
        paddingBottom: 0,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '5%',
    },
    title: {
        fontSize: 22,
        fontFamily: 'Roboto-700',
        color: '#fffc',
    },
    messageText: {
        fontSize: 18,
        fontFamily: 'Roboto-600',
        color: '#fff',
        marginBottom: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: '#0014',
        padding: '5%',
    },
    messageDismiss: {
        justifyContent: 'center',
        padding: '4%',
        width: '45%',
        borderRadius: deviceWidth * 0.02,
        borderWidth: deviceWidth * 0.002,
        borderColor: '#fff',
    },
    messageOkay: {
        fontSize: 20,
        fontFamily: 'Roboto-700',
        textAlign: 'center',
        color: '#fff',
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
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/themed';
import { Header } from '@/components/Header';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import { Prompt } from '@/components/Prompt';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

export default function CardList() {

    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    const [isInfoLoading, setIsInfoLoading] = useState(true);
    const [showSortingOptions, setShowSortingOptions] = useState(false);
    const [showMessage, setshowMessage] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [wait, setWait]  = useState(false);
    const [sorting, setSorting] = useState(0);
    const [idsToRemove, setIdsToRemove] = useState<string[]>([]);

    const initialRef:any = null;
    const myFlatList = useRef(initialRef);
    const cardList = useRef(initialRef);
    const pageCardList = useRef([]);
    const numberOfPages = useRef(0);
    const currentPage = useRef(0);
    const deleteAll = useRef(false);
    const errorMessage = useRef('');

    const bgImg = require('../assets/images/bg.png');

    const resultsLength = 15;

    useEffect(() => {
        const backAction = () => {
            if (showConfirm) {
                setShowConfirm(false);
                return true;
            } else if (idsToRemove.length > 0) {
                setIdsToRemove([]);
                return true;
            }
        };

          const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
          );
          return () => backHandler.remove();
    }, [idsToRemove.length, showConfirm]);

    useEffect(() => {
        const loadCardList = async () => {
            setIsInfoLoading(true);

            const allKeys = await AsyncStorage.getAllKeys();
            const keys = allKeys.filter(key => !isNaN(Number(key)));
            if (keys != null) {
                const result = await AsyncStorage.multiGet(keys);
                if (result != null) {
                    cardList.current = await extractValues(result);
                    pageCardList.current = cardList.current.slice(0, resultsLength < cardList.current.length ? resultsLength : cardList.current.length);
                    numberOfPages.current = Math.ceil(cardList.current.length / resultsLength);
                    if (myFlatList.current) {
                        myFlatList.current.scrollTo({animated: false, y: 0});
                    }
                    setSorting(0);
                    setIsInfoLoading(false);
                }
            }
        };

        const extractValues = async (pairs:any) => {
            let res = [];
            for (let pair of pairs) {
                const value = JSON.parse(pair[1]);
                res.push({info: value});
            }
            res.sort((a, b) => (a.info.id - b.info.id));
            return res;
        };
        loadCardList();
    }, []);

    const deleteEntries = async () => {
        setWait(true);
        setShowConfirm(false);

        if (!deleteAll.current) {
            for (let i = 0; i < idsToRemove.length; i++) {
                const id = idsToRemove.length > 0 && idsToRemove[i];
                try {
                    await AsyncStorage.removeItem(id.toString());
                    cardList.current = (cardList.current.filter((obj:any) => {
                        return obj.info.id !== id;
                    }));
                    if (i === idsToRemove.length - 1) {
                        setIdsToRemove([]);

                        if (cardList.current.length <= (numberOfPages.current - 1) * resultsLength) {
                            numberOfPages.current -= 1;
                        }

                        if (cardList.current.length >= (currentPage.current) * resultsLength + 1){
                            showPage(currentPage.current);
                        } else {
                            showPage(Math.max(0, currentPage.current - 1));
                        }
                    }
                } catch (e) {
                    errorMessage.current = "There was an error while trying to delete selected entries, please try again";
                    setshowMessage(true);
                }
            }
        }
        else {
            for (let c of cardList.current) {
                try {
                    await AsyncStorage.removeItem(c.info.id.toString());
                }
                catch (e) {
                    console.log(e);
                    errorMessage.current = "There was an error while trying to delete some entries from the database, please try again";
                    setshowMessage(true);
                }
            }
            cardList.current = null;
            setWait(false);
        }
    };

    const sortCards = (sort:number) => {
        if (sort !== sorting) {
            setShowSortingOptions(false);
            setWait(true);
            switch (sort) {
                case 0 :
                    cardList.current.sort((a: any, b: any) => (a.info.id - b.info.id));
                    break;
                case 1 :
                    cardList.current.sort((a: any, b: any) => -(a.info.id - b.info.id));
                    break;
                case 2 :
                    cardList.current.sort((a: any, b: any) => ((a.info.name[0].en).localeCompare(b.info.name[0].en)));
                    break;
                case 3 :
                    cardList.current.sort((a: any, b: any) => -((a.info.name[0].en).localeCompare(b.info.name[0].en)));
                    break;
            }
            setSorting(sort);

            setTimeout(() => {
                showPage(currentPage.current);
            }, 1000);
        }
    };

    const showPage = (page: number) => {
        if (!wait) {
            setWait(true);
        }
        setTimeout(() => {
            currentPage.current = page;
            pageCardList.current = cardList.current.slice(page * resultsLength, (page + 1) * resultsLength < cardList.current.length ? (page + 1) * resultsLength : cardList.current.length);
            setWait(false);
            if (myFlatList.current) {
                myFlatList.current.scrollTo({animated: false, y: 0});
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

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground source={bgImg} resizeMode="cover" style={styles.image}>
                <Header title={'Card history'}
                thirdIcon={cardList.current && cardList.current.length > 1 && !(idsToRemove.length > 0) ? 'sort'
                    : cardList.current && cardList.current.length > 0 && idsToRemove.length > 0 ? 'playlist-remove' : ''}
                thirdSize={deviceWidth * 0.075}
                thirdFunction={cardList.current && cardList.current.length > 0 && !(idsToRemove.length > 0)
                ? () => setShowSortingOptions(!showSortingOptions)
                : cardList.current && cardList.current.length > 0 && idsToRemove.length > 0
                    ? () => {
                        deleteAll.current = false;
                        setShowConfirm(true);
                    }
                    : null}
                thirdStyle={{opacity: showSortingOptions ? 0.5 : 1}}
                firstIcon={cardList.current && cardList.current.length > 0 ? 'broom' : ""}
                firstSize={deviceWidth * 0.07}
                firstFunction={cardList.current && cardList.current.length > 0 && !showSortingOptions 
                    ? () => {
                        deleteAll.current = true;
                        setShowConfirm(true);
                    }
                    : null}
                firstStyle={{display: showSortingOptions ? 'none' : 'flex'}}
                firstColor={"#f66"}
                />
                {
                wait &&
                <View style={styles.wait}>
                    <ActivityIndicator color={'#ffffff'} size={64}/>
                    <Text style={styles.waitText}>Please wait...</Text>
                </View>
                }
                {
                (!cardList.current || !(cardList.current.length > 0)) &&
                <View style={styles.innerContainer}>
                    {
                    isInfoLoading &&
                    <ActivityIndicator size={120} color={'#ffffff'}/>
                    }
                    {
                    !isInfoLoading &&
                    <View style={styles.emptyMsg}>
                        <Image source={require('../assets/images/no-card-found.png')} resizeMode="contain" style={{height: '50%'}}/>
                        <Text style={styles.emptyText}>NO CARDS FOUND</Text>
                    </View>
                    }
                </View>
                }
                {
                showSortingOptions &&
                <View style={styles.optionsContainer}>
                    <View style={styles.optionsFrame}>
                        <TouchableOpacity disabled={sorting === 0} style={[styles.optionContainer, {borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: sorting === 0 ? "#454658" : "#232436"}]} onPress={() => {
                            sortCards(0);
                        }}>
                            <View style={styles.radioButton}>
                                {sorting === 0 && <View style={styles.radioThumb} />}
                            </View>
                            <Text style={styles.optionText}>0-9</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={sorting === 1} style={[styles.optionContainer, {backgroundColor: sorting === 1 ? "#454658" : "#232436"}]} onPress={() => {
                            sortCards(1);
                        }}>
                            <View style={styles.radioButton}>
                            {sorting === 1 && <View style={styles.radioThumb} />}
                            </View>
                            <Text style={styles.optionText}>9-0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={sorting === 2} style={[styles.optionContainer, {backgroundColor: sorting === 2 ? "#454658" : "#232436"}]} onPress={() => {
                            sortCards(2);
                        }}>
                            <View style={styles.radioButton}>
                            {sorting === 2 && <View style={styles.radioThumb} />}
                            </View>
                            <Text style={styles.optionText}>A-Z</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={sorting === 3} style={[styles.optionContainer, {borderBottomLeftRadius: 16, borderBottomRightRadius: 16, backgroundColor: sorting === 3 ? "#454658" : "#232436"}]} onPress={() => {
                            sortCards(3);
                        }}>
                            <View style={styles.radioButton}>
                            {sorting === 3 && <View style={styles.radioThumb} />}
                            </View>
                            <Text style={styles.optionText}>Z-A</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                }
                {
                showConfirm &&
                <Prompt description={deleteAll.current 
                    ? `Delete all entries? (${cardList.current.length} total)`
                    : `Delete the selected entries? (${idsToRemove.length} total)`} 
                    type={'yesno'} noAction={() => setShowConfirm(false)} yesAction={() => deleteEntries()}/>
                }
                {showMessage && 
                <Prompt description={errorMessage.current} type={'ok'} okAction={() => setshowMessage(false)} />
                }
                {
                cardList.current && cardList.current.length > 0 &&
                <ScrollView ref={myFlatList} contentContainerStyle={styles.cardsContent}>
                    {
                        pageCardList.current.map((item: any, index: number) => {
                            const nextItem: any = pageCardList.current[index + 1];
                            return (
                                <TouchableOpacity key={item.info.id}
                                style={[styles.item, {
                                    backgroundColor: idsToRemove.includes(item.info.id, 0) ? '#ddddff28' : 'transparent',
                                    borderBottomWidth:
                                        idsToRemove.includes(item.info.id, 0) && index < pageCardList.current.length - 1 && idsToRemove.includes(nextItem.info.id) ? 1 : 0}]} 
                                
                                onLongPress={() => {    
                                    const indexUpdated = [...idsToRemove];
                                    
                                    if (idsToRemove.includes(item.info.id)) {
                                        indexUpdated.splice(indexUpdated.indexOf(item.info.id), 1);
                                    }
                                    else {
                                        indexUpdated.push(item.info.id);
                                    }
                                    setIdsToRemove(indexUpdated);
                                } } onPress={() => {
                                    if (idsToRemove.length > 0) {
                                        const indexUpdated = [...idsToRemove];
                                        if (idsToRemove.includes(item.info.id)) {
                                            indexUpdated.splice(indexUpdated.indexOf(item.info.id), 1);
                                        }
                                        else {
                                            indexUpdated.push(item.info.id);
                                        }
                                        setIdsToRemove(indexUpdated);
                                    }
                                    else {
                                        router.navigate({pathname: 'card-info', params: {id: item.info.id.toString()}});
                                    }
                                }}>
                                    <Image style={styles.cardImage} source={{uri: item.info.card_images[0].image_url}}/>
                                    <View style={styles.cardData}>
                                        <Text style={styles.cardId}>{item.info.id.toString().length < 8 ? '[0' + item.info.id + ']' : '[' + item.info.id + ']'}</Text>
                                        <Text style={styles.cardName}>
                                            {item.info.name[0].en ? item.info.name[0].en : item.info.name[0].en}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    }
                    <View style={styles.pagesContainer}>
                        {!(idsToRemove.length > 0) &&
                        <>
                            {(currentPage.current === 0 && numberOfPages.current === 2 || currentPage.current === 1 && numberOfPages.current > 2) &&
                            <View style={{width: deviceWidth * 0.07}} />
                            }
                            {
                            currentPage.current > 1 &&
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
                        </>
                        }
                    </View>
                </ScrollView>
                }
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#232436',
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
    image: {
        height: '100%',
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
        justifyContent: 'center',
    },
    headerText: {
        width: '55%',
        fontFamily: 'Roboto-700',
        fontSize: 26,
        color: '#ffffff',
    },
    funcButtonsContainer: {
        width: '30%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    funcButton: {
        width: '50%',
        height: '100%',
        justifyContent: 'center',
    },
    innerContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMsg: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '40%',
        opacity: 0.65,
    },
    emptyText: {
        width: '90%',
        color: '#ffffff',
        fontFamily: 'Roboto-700',
        fontSize: 36,
        marginTop: '5%',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        height: '94%',
        position: 'absolute',
        top: '6%',
        right: 0,
        zIndex: 500,
        backgroundColor: '#000c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsFrame: {
        width: '100%',
        maxWidth: 300,
        backgroundColor: '#454658',
        flexDirection: 'column',
        gap: 1,
        borderRadius: 16,
    },
    optionContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#232436',
        gap: Math.min(deviceWidth * 0.05, 16),
        paddingVertical: Math.min(deviceWidth * 0.08, 24),
        paddingHorizontal: Math.min(deviceWidth * 0.1, 32),
    },
    radioButton: {
        width: Math.min(deviceWidth * 0.08, 48),
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#001',
        borderRadius: 500,
    },
    radioThumb: {
        width: '60%',
        aspectRatio: 1,
        backgroundColor: '#fff8',
        borderRadius: 500,
    },
    optionText: {
        fontFamily: 'Roboto',
        color: '#ffffffc0',
        fontSize: 22,
    },
    cardsContent: {
        minHeight: '94%',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
        position: 'absolute',
        zIndex: 400,
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#24242e',
    },
    confirmTitle: {
        fontSize: 22,
        fontFamily: 'Roboto-700',
        color: '#ffffff',
        marginBottom: 24,
    },
    confirmText: {
        fontSize: 18,
        fontFamily: 'Roboto-600',
        color: '#ffffff',
        marginBottom: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'flex-end',
        gap: 50,
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
    item: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: deviceWidth * 0.05,
        padding: '5%',
    },
    cardImage: {
        width: '20%',
        maxWidth: 100,
        aspectRatio: 0.686,
    },
    cardData: {
        width: deviceWidth * 0.85 - (Math.min(deviceWidth * 0.9 * 0.2, 100)),
        justifyContent: 'center',
    },
    cardId: {
        fontFamily: 'Roboto-600',
        fontSize: 20,
        color: '#fff',
    },
    cardName: {
        fontFamily: 'Roboto-700',
        fontSize: 22,
        color: '#fff',
    },
    pagesContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: '7.5%',
        marginBottom: '2.5%',
        gap: Math.max(16, Dimensions.get('window').width * 0.03),
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
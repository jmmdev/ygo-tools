import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageBackground,
ScrollView, StyleSheet, Switch, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/themed';
import { Header } from '@/components/Header';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { Prompt } from '@/components/Prompt';

const deviceWidth = Dimensions.get('window').width;

export default function SetCards() {
    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    const [isInfoLoading, setIsInfoLoading] = useState(true);
    const [wait, setWait]  = useState(false);
    const [changed, setChanged] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savedConfirmation, setSavedConfirmation] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const initialRef:any = null;
    const setCardsRef = useRef(initialRef);
    const setName = useRef('');
    const errorMessage = useRef('');
    const cardList = useRef<any[]>([]);
    const pageCardList = useRef<any[]>([]);
    const currentPage = useRef(0);
    const numberOfPages = useRef(0);
    const setIndex = useRef(-1);

    const bg = require('../assets/images/bg.png');
    const resultsLength = 15;
    
    const params = useLocalSearchParams(); 

    useEffect(() => {
        const loadSetCards = async () => {
            let mySetInfo = typeof params.set === "string" ? JSON.parse(params.set) : null;
            setIndex.current = Number(params.setIndex);

            setName.current = mySetInfo.set.set_name;
            cardList.current = [...mySetInfo.cards];

            try {
                const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=' + setName.current);
                if (response.ok) {
                        const result = await response.json();

                        for (let c of result.data) {
                            if (!setHasCard(c)) {
                                let cardRarities = [];

                                for (let s of c.card_sets) {
                                    if (s.set_name === setName.current) {
                                        cardRarities.push(
                                            {
                                                set_code: s.set_code,
                                                rarity: s.set_rarity,
                                                rarity_code: s.set_rarity_code,
                                                acquired: false,
                                            }
                                        );
                                    }
                                }

                                for (let r of cardRarities) {
                                    let myCard = {
                                        id: c.id,
                                        name: c.name,
                                        img: c.card_images[0].image_url,
                                        rarity_info: r,
                                    };
                                    cardList.current.push(myCard);
                                }
                            }
                        }
                        cardList.current.sort((a:any, b:any) => sortCards(a, b));
                        pageCardList.current = cardList.current.slice(0, resultsLength < cardList.current.length ? resultsLength : cardList.current.length);
                        numberOfPages.current = Math.ceil(cardList.current.length / resultsLength);

                        setIsInfoLoading(false);
                } else {
                    errorMessage.current = 'Set cards information could not be retrieved. Please try again';
                    setShowMessage(true);
                    setIsInfoLoading(false);
                }
            } catch (e:any) {
                
                setIsInfoLoading(false);
            }
        };
        loadSetCards();
    }, []);

    const showPage = (page:number) => {
        if (!wait) {
            setWait(true);
        }
        setTimeout(() => {
            currentPage.current = page;
            pageCardList.current = cardList.current.slice(page * resultsLength, (page + 1) * resultsLength < cardList.current.length
            ? (page + 1) * resultsLength : cardList.current.length);

            setWait(false);
            if (setCardsRef.current) {
                setCardsRef.current.scrollTo({animated: false, y: 0});
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

    const setCardAcquired = (index:number, acquired:boolean) => {
        cardList.current[index].rarity_info.acquired = acquired;
        setChanged(changed + 1);
    };

    const saveChanges = async () => {
        setWait(true);

        try {
            const result = await AsyncStorage.getItem('collection');
            if (result) {
                let collection = JSON.parse(result);
                (collection[setIndex.current]).cards = [...cardList.current];
                await AsyncStorage.setItem('collection', JSON.stringify(collection));
                setWait(false);
                setSavedConfirmation(true);
                setTimeout(() => {
                    setChanged(0);
                    setSavedConfirmation(false);
                }, 1500);
            } else {
                errorMessage.current = 'No collection found. Please try again';
                setShowMessage(true);
                setWait(false);
            }
        } catch (e) {
            errorMessage.current = 'Error while retrieving collection information. Please try again';
            setShowMessage(true);
            setWait(false);
        }
    };

    const headerGoBackFunction = () => {
        if (changed > 0) {
            setShowConfirm(true);
        } else {
            router.back();
        }
    };

    const setHasCard = (card:any) => {
        for (let c of cardList.current) {
            if (c.id === card.id) {
                return true;
            }
        }
        return false;
    };

    const sortCards = (a:any, b:any) => {
        return a.rarity_info.set_code.localeCompare(b.rarity_info.set_code);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg}>
                <Header
                title={setName.current.length <= 20 ? setName.current : setName.current.substring(0, 20) + '...'}
                goBackFunction={() => headerGoBackFunction()} firstIcon={'content-save'} firstSize={deviceWidth * 0.06}
                firstFunction={() => saveChanges()} firstStyle={{opacity: changed > 0 ? 1 : 0.5, backgroundColor: changed > 0 ? '#0c6' : 'transparent'}} firstDisabled={!changed} />
                {
                wait &&
                <View style={styles.wait}>
                    <ActivityIndicator color={'#ffffff'} size={64}/>
                    <Text style={styles.waitText}>Please wait...</Text>
                </View>
                }
                {
                savedConfirmation &&
                <View style={styles.confirmContainer}>
                    <View style={styles.savedFrame}>
                        <Text style={styles.deckSavedText}>Collection saved!</Text>
                        <Icon color="#0f9" name="check" size={40} type="material-community"/>
                    </View>
                </View>
                }
                {
                isInfoLoading &&
                <View style={styles.loading}>
                    <ActivityIndicator size={120} color={'#ffffffb0'}/>
                </View>
                }
                {!isInfoLoading &&
                    <>
                    {cardList.current && cardList.current.length > 0 &&
                    <ScrollView ref={setCardsRef} contentContainerStyle={styles.cardsContent}>
                        <View style={styles.cardsContainer}>
                        {
                            pageCardList.current.map((card:any, index:number) => {
                                return (
                                    <View key={index} style={styles.cardContainer}>
                                        <Image style={styles.cardImage} source={card.img ? {uri: card.img} : require('../assets/images/no-card-found.png')} />
                                        <Text style={styles.cardRarity}>
                                            {`[${card.rarity_info.set_code}]\n${card.rarity_info.rarity}`}
                                        </Text>
                                        <View style={[styles.acquiredContainer, {backgroundColor: card.rarity_info.acquired ? '#0c6' : '#555'}]}>
                                            <Switch trackColor={{true: 'transparent', false: 'transparent'}} thumbColor={card.rarity_info.acquired ? '#fff' : '#999'}
                                            onValueChange={() => setCardAcquired(currentPage.current * resultsLength + index, !card.rarity_info.acquired)} value={card.rarity_info.acquired} />
                                        </View>
                                    </View>
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
                    {!cardList.current || !(cardList.current.length > 0) &&
                    <View style={styles.container}>
                        <View style={styles.emptyMsg}>
                            <Image source={require('../assets/images/no-card-found.png')} resizeMode="contain" style={{height: '50%'}}/>
                            <Text style={styles.emptyText}>NO CARDS FOUND</Text>
                        </View>
                    </View>
                    }
                    {showMessage &&
                    <Prompt description={errorMessage.current} type={'ok'}
                        okAction={() => {
                            setShowMessage(false);
                            router.back();
                        }}
                    />
                    }
                    {
                    showConfirm &&
                    <Prompt description={'Do you want to leave? All your unsaved changes will be discarded'} type={'yesno'}
                    noAction={() => setShowConfirm(false)}
                    yesAction={() => {
                        setShowConfirm(false);
                        router.back();
                    }} />
                    }
                    </>
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
    cardsContent: {
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5%',
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cardContainer: {
        maxWidth: (deviceWidth * 0.9 - 16) * 0.333,
        marginBottom: deviceWidth * 0.1,
        alignItems: 'center',
        gap: deviceWidth * 0.02,
    },
    alternateIcon: {
        position: 'absolute',
        zIndex: 600,
        bottom: 0,
        right: 0,
        backgroundColor: '#0008',
    },
    cardImage: {
        height: (deviceWidth * 0.9 - 16) * 0.333 / 0.686,
        aspectRatio: 0.686,
    },
    textContainer: {
        width: '100%',
        height: deviceWidth * 0.2,
        justifyContent: 'space-between',
    },
    cardRarity: {
        width: (deviceWidth * 0.9 * 0.333 - 8),
        color: '#fff',
        fontSize: Math.max(16, deviceWidth * 0.02),
        textAlign: 'center',
        fontFamily: 'Roboto-700',
    },
    acquiredContainer: {
        flexDirection: 'row',
        padding: '2%',
        borderRadius: deviceWidth * 0.333 * 0.5,
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
    savedFrame: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deckSavedText: {
        fontSize: 32,
        color: '#fff',
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
        fontFamily: 'Roboto-700',
        color: '#ffffff',
        marginBottom: '5%',
    },
    confirmText: {
        fontSize: 18,
        fontFamily: 'Roboto-600',
        color: '#ffffff',
        marginBottom: '5%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'flex-end',
        gap: Math.min(100, deviceWidth * 0.1),
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
});

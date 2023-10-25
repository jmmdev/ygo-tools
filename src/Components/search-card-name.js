/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import {useToast} from 'react-native-toast-notifications';

import { Icon } from '@rneui/themed';

const SearchCardName = ({showEnterNameFunction, cardSelectionFunction, cardElementIcon, cardIconTransform, cardSearchFilter, lockLanguage, showToast}) => {

    const toast = useToast();
    const pagesResultsLength = 15;
    const deviceWidth = Dimensions.get('window').width;

    const errorTitle = useRef(null);
    const errorMessage = useRef(null);
    const [showMessage, setShowMessage] = useState(false);
    const [text, setText] = useState('');
    const [updatingList, setUpdatingList] = useState(false);
    const [showClear, setShowClear] = useState(false);

    const cardList = useRef(null);
    const lastSearch = useRef('');
    const myTextInput = useRef(null);
    const pageCardList = useRef(null);
    const myFlatList = useRef(null);
    const numberOfPages = useRef(0);
    const currentPage = useRef(0);

    const fetchCardsByName = () => {
        if (text.trim().length > 0 && lastSearch.current.trim() !== text.trim()) {
            setUpdatingList(true);
            lastSearch.current = text;
            currentPage.current = 0;
            try {
                fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=' + text)
                .then(cardInfo => {
                    if (cardInfo.ok) {
                            cardInfo.json()
                            .then(result => {
                                try {
                                    cardList.current = result.data;

                                    if (cardSearchFilter) {
                                        cardList.current = cardList.current.filter(cardSearchFilter);
                                    }

                                    if (!cardList.current.length > 0) {
                                        throw new Error('Invalid name input');
                                    }

                                    pageCardList.current = cardList.current.slice(0, pagesResultsLength < cardList.current.length ? pagesResultsLength : cardList.current.length);

                                    numberOfPages.current = Math.ceil(cardList.current.length / pagesResultsLength);

                                    if (myFlatList.current) {
                                        myFlatList.current.scrollTo({animated: false, y: 0});
                                    }
                                    setUpdatingList(false);
                                } catch (e) {
                                    errorTitle.current = e.message;
                                    errorMessage.current = 'No cards exist with name "' + text + '".\n\nPlease verify your search and try again';
                                    setUpdatingList(false);
                                    setShowMessage(true);
                                }
                            }).catch((e) => {
                                errorTitle.current = e.message;
                                errorMessage.current = 'Error in data conversion.\n\nMaybe there was an error with the database or the operation failed. Please try again';
                                setUpdatingList(false);
                                setShowMessage(true);
                            });
                    }
                    else {
                        errorTitle.current = 'Invalid name input';
                        errorMessage.current = 'No cards exist with name "' + text + '".\n\nPlease verify your search and try again';
                        setUpdatingList(false);
                        setShowMessage(true);
                    }
                })
                .catch((e) => {
                    errorTitle.current = e.message;
                    errorMessage.current = 'Error while fetching card data.\n\nPlease check your internet connection and try again';
                    setUpdatingList(false);
                    setShowMessage(true);
                });
            } catch (e) {
                errorTitle.current = '[' + e + ']';
                errorMessage.current = 'There was an unexpected error. Please try again';
                setUpdatingList(false);
                setShowMessage(true);
            }
        }
    };

    const showPage = (page) => {
        setUpdatingList(true);
        setTimeout(() => {
            currentPage.current = page;
            pageCardList.current = cardList.current.slice(page * pagesResultsLength, (page + 1) * pagesResultsLength < cardList.current.length ? (page + 1) * pagesResultsLength : cardList.current.length);
            setUpdatingList(false);
            myFlatList.current.scrollTo({animated: false, y: 0});
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
        <>
            {updatingList &&
            <View style={styles.updating}>
                <ActivityIndicator color={'#ffffffb0'} size={64}/>
                <Text style={styles.updatingText}>Please wait...</Text>
            </View>
            }
            {showMessage &&
            <View style={styles.errorContainer}>
                <View style={styles.errorFrame}>
                    <Text adjustsFontSizeToFit={true} style={styles.errorTitle}>{errorTitle.current}</Text>
                    <Text style={styles.errorText}>{errorMessage.current}</Text>
                    <TouchableOpacity style={styles.errorDismiss} onPress={() => {
                        setShowMessage(false);
                        myTextInput.current.focus();
                    }}>
                        <Text style={styles.errorOkay}>Dismiss</Text>
                    </TouchableOpacity>
                </View>
            </View>
            }
            <View style={styles.nameSearch}>
                <TouchableOpacity style={styles.backButton} onPress={() => {
                    cardList.current = null;
                    lastSearch.current = '';
                    showEnterNameFunction(false);
                    setText('');
                }}>
                    <Icon color="#fffc" name="arrow-left" size={deviceWidth * 0.08} type="material-community"/>
                </TouchableOpacity>
                <View style={styles.inputStyle}>
                    <TextInput maxLength={30} style={[styles.nameInput, {fontStyle: text.length > 0 ? 'normal' : 'italic'}]} onFocus={() => setShowClear(text.length > 0)} ref={myTextInput} value={text} onChangeText={(value) => {
                        setText(value);
                        setShowClear(value.length > 0);
                    }} onSubmitEditing={() => {
                        setShowClear(false);
                        fetchCardsByName();
                        }} selectionColor={'#ffffff68'} autoFocus={true} placeholderTextColor={'#fff4'} placeholder={'Enter card name'} />
                    {text.length > 0 && showClear &&
                    <TouchableOpacity style={styles.closeButton} onPress={() => {
                        setText('');
                        myTextInput.current.focus();
                    }}>
                        <Icon color="#ffffffc0" name="close-circle" size={Math.max(deviceWidth * 0.05, 26)} type="material-community"/>
                    </TouchableOpacity>}
                </View>
            </View>
            {
            (!cardList.current || !cardList.current.length > 0) &&
            <View style={styles.emptySearchContainer}>
                <Icon color="#ffffff40" name="search" size={200} type="material"/>
            </View>
            }
            {
            cardList.current && cardList.current.length > 0 &&
            <>
                <ScrollView ref={myFlatList} contentContainerStyle={styles.cardsContent}>
                    <View style={{gap: Dimensions.get('window').height * 0.025}}>
                    {
                        pageCardList.current.map((item, index) => {
                            return (
                                <TouchableOpacity key={item.id} onPress={() => {
                                    const myItemName = item.name;
                                    const added = cardSelectionFunction(item);
                                    let type;

                                    if (showToast) {
                                        if (added) {
                                            cardList.current.splice(index + (pagesResultsLength * currentPage.current), 1);
                                            numberOfPages.current = Math.ceil(cardList.current.length / pagesResultsLength);

                                            if (cardList.current.length <= currentPage.current * pagesResultsLength) {
                                                currentPage.current--;
                                            }
                                            pageCardList.current = cardList.current.slice(currentPage.current * pagesResultsLength, (currentPage.current + 1) * pagesResultsLength < cardList.current.length ? (currentPage.current + 1) * pagesResultsLength : cardList.current.length);

                                            type = 'success';
                                        } else {
                                            type = 'danger';
                                        }
                                        toast.show(
                                            myItemName,
                                            {
                                                type: type,
                                                placement: 'bottom',
                                                duration: 4000,
                                                animationType: 'slide-in',
                                            }
                                        );
                                    }
                                }}>
                                    <View style={styles.item}>
                                        <Image style={styles.cardImage} source={{uri: item.card_images[0].image_url}} />
                                        <View style={styles.cardData}>
                                            <Text style={styles.cardId}>[{item.id}]</Text>
                                            <Text style={styles.cardName}>{item.name}</Text>
                                        </View>
                                        <View style={{width: '10%', alignSelf: 'flex-start'}}>
                                            <Icon style={cardIconTransform} color="#ffffff80" name={cardElementIcon} size={Math.max(24, deviceWidth * 0.05)} type="material-community"/>
                                        </View>
                                    </View>
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
                                <Icon color="#fff" name="page-first" size={22} type="material-community"/>
                            </TouchableHighlight>
                        }
                        {showPages()}
                        {currentPage.current < numberOfPages.current - 2 &&
                            <TouchableHighlight style={styles.firstAndLastPage} underlayColor={'none'} onPress={() => showPage(numberOfPages.current - 1)}>
                                <Icon color="#fff" name="page-last" size={22} type="material-community"/>
                            </TouchableHighlight>
                        }
                        {(currentPage.current === numberOfPages.current - 1 && numberOfPages.current === 2 || currentPage.current === numberOfPages.current - 2 && numberOfPages.current > 2) &&
                            <View style={{width: deviceWidth * 0.07}} />
                        }
                    </View>
                </ScrollView>
            </>
            }
        </>
    );
};

const styles = StyleSheet.create({
    backButton: {
        width: '12.5%',
        height: '100%',
        justifyContent: 'center',
    },
    updating: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000000c0',
        zIndex: 500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updatingText: {
        fontFamily: 'Roboto',
        fontSize: 32,
        color: '#ffffffd0',
        marginTop: '5%',
    },
    errorContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 600,
        backgroundColor: '#000000c0',
    },
    errorFrame: {
        width: '80%',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#24242e',
    },
    errorTitle: {
        width: '100%',
        maxHeight: 26,
        fontSize: 22,
        fontFamily: 'Roboto',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: 24,
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        fontWeight: 600,
        color: '#ffffff',
        marginBottom: 24,
    },
    errorDismiss: {
        alignSelf: 'flex-end',
        justifyContent: 'center',
    },
    errorOkay: {
        fontSize: 18,
        fontFamily: 'Roboto',
        textAlign: 'center',
        color: '#ffdd00',
    },
    nameSearch: {
        width: '100%',
        height: '8%',
        backgroundColor: '#232436',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputStyle: {
        width: '85%',
        height: '75%',
        paddingHorizontal: '2.5%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#00000060',
        borderRadius: 200,
    },
    nameInput: {
        width: '90%',
        height: '80%',
        fontFamily: 'Roboto',
        fontSize: 24,
        color: '#ffffff',
        padding: 0,
    },
    closeButton: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptySearchContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardsContent: {
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5%',
    },
    item: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardImage: {
        width: '20%',
        marginRight: '5%',
        aspectRatio: 0.686,
    },
    cardData: {
        width: '60%',
        justifyContent: 'center',
        marginRight: '5%',
    },
    cardId: {
        fontFamily: 'Roboto',
        fontSize: 20,
        fontWeight: 600,
        color: '#ffffff',
    },
    cardName: {
        fontFamily: 'Roboto',
        fontSize: 26,
        fontWeight: 700,
        color: '#ffffff',
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
    codeInputForm: {
        flex: 1,
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeInput: {
        width: '70%',
        height: 48,
        marginBottom: '5%',
        backgroundColor: '#2a2a40',
        fontSize: 24,
        padding: 0,
        paddingLeft: '4%',
    },
    codeInputButtons: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '70%',
        height: 48,
    },
    inputButton: {
        width: '48%',
        height: '100%',
        backgroundColor: '#13131d',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputButtonText: {
        fontFamily: 'Roboto',
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 700,
    },
    buttonContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    button: {
        padding: '5%',
        display: 'flex',
        width: '70%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        borderColor: '#ffffff',
        borderWidth: 1,
        backgroundColor: '#13131d',
    },
    buttonText: {
        color: '#ffffff',
        fontFamily: 'Roboto',
        fontSize: 24,
        marginLeft: '5%',
        fontWeight: 700,
    },
});

export default SearchCardName;

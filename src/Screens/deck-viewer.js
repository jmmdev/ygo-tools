/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, DeviceEventEmitter, Dimensions, Image, ImageBackground, SafeAreaView, ScrollView,
    StyleSheet, Text, TextInput, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/base';
import QRCode from 'react-native-qrcode-svg';
import Draggable from 'react-native-draggable';
import DrawTest from '../Components/draw-test.js';

const deviceWidth = Dimensions.get('window').width;

const DeckViewerScreen = ({navigation, route}) => {
    DeviceEventEmitter.addListener('event.updateDeck', editedDeck => {
        setDeck(editedDeck);
    });
    const qrSize = deviceWidth * 0.6;

    const bg = require('../../assets/bg.png');

    const [isInfoLoading, setIsInfoLoading] = useState(false);
    const [showInputName, setShowInputName] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [text, setText] = useState('');
    const [saved, setSaved] = useState(false);
    const [showWrongName, setShowWrongName] = useState(false);
    const [savedConfirmation, setSavedConfirmation] = useState(false);
    const [wait, setWait]  = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);
    const [showImages, setShowImages] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrUrl, setQrUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [fullList, setFullList] = useState(null);
    const [deck, setDeck] = useState(null);
    const [croppedImages, setCroppedImages] = useState(null);
    const [drawTest, setDrawTest] = useState(false);
    const [showImgZones, setShowImgZones] = useState(false);
    const [draggableInfo, setDraggableInfo] = useState(null);

    const mainPrice = useRef(null);
    const extraPrice = useRef(null);
    const sidePrice = useRef(null);
    const mainDeckCardNumber = useRef(0);
    const nameToEdit = useRef(null);
    const myCropper = useRef(null);
    const topPercent = useRef(0);

    useEffect(() => {
        const backAction = () => {
            if (showQR) {
                setShowQR(false);
                return true;
            }
        };

          const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
          );
          return () => backHandler.remove();
    }, [showQR]);

    useEffect(() => {
        setIsInfoLoading(true);
        if (route.params.new) {
            if (!route.params.deck) {
                setIsInfoLoading(false);
                return;
            }
        }

        nameToEdit.current = route.params.deck.name;
        setText(nameToEdit.current);
        setDeck(route.params.deck);
    }, [route.params.deck, route.params.new]);

    useEffect(() => {
        const loadDeckContents = async () => {
            if (deck && deck.content.length > 0) {
                mainPrice.current = {cardmarket_price: 0, tcgplayer_price: 0, ebay_price: 0, amazon_price: 0, coolstuffinc_price: 0};
                extraPrice.current = {cardmarket_price: 0, tcgplayer_price: 0, ebay_price: 0, amazon_price: 0, coolstuffinc_price: 0};
                sidePrice.current = {cardmarket_price: 0, tcgplayer_price: 0, ebay_price: 0, amazon_price: 0, coolstuffinc_price: 0};

                let mainAux = [];
                let extraAux = [];
                let sideAux = [];

                const lines = deck.content.split('\n');

                let deckIndex = -1;

                for (let line of lines) {
                    line = line.trim();
                    if (line.length > 0) {
                        if (line === '#main') {
                            deckIndex = 0;
                        }
                        else if (line === '#extra') {
                            deckIndex = 1;
                        }
                        else if (line === '!side') {
                            deckIndex = 2;
                        } else if (!isNaN(line)) {
                            let index;
                            switch (deckIndex) {
                                case 0:
                                    index = mainAux.findIndex(item => item.id === line);
                                    if (index >= 0) {
                                        mainAux[index].quantity++;
                                    }
                                    else {
                                        mainAux.push({id: line, quantity: 1});
                                    }
                                    break;
                                case 1:
                                    index = extraAux.findIndex(item => item.id === line);
                                    if (index >= 0) {
                                        extraAux[index].quantity++;
                                    }
                                    else {
                                        extraAux.push({id: line, quantity: 1});
                                    }
                                    break;
                                case 2:
                                    index = sideAux.findIndex(item => item.id === line);
                                    if (index >= 0) {
                                        sideAux[index].quantity++;
                                    }
                                    else {
                                        sideAux.push({id: line, quantity: 1});
                                    }
                                    break;
                            }
                        }
                    }
                }

                let images = [];

                let mainList = [];

                for (let m of mainAux) {
                    const card = await searchByCode(m.id);

                    if (card !== null){
                        const image_crop = card.card_images[0].image_url_cropped;
                        images.push(image_crop);

                        mainList.push({card: card, quantity: m.quantity});
                    }
                }

                let extraList = [];

                for (let e of extraAux) {
                    const card = await searchByCode(e.id);

                    if (card !== null){
                        const image_crop = card.card_images[0].image_url_cropped;
                        images.push(image_crop);

                        extraList.push({card: card, quantity: e.quantity});
                    }
                }

                let sideList = [];

                for (let s of sideAux) {
                    const card = await searchByCode(s.id);

                    if (card !== null){
                        const image_crop = card.card_images[0].image_url_cropped;
                        images.push(image_crop);

                        sideList.push({card: card, quantity: s.quantity});
                    }
                }

                images.sort((a, b) => a === deck.img ? -1 : b === deck.img ? 1 : 0);

                for (let m of mainList) {
                    mainPrice.current.cardmarket_price += Number(m.card.card_prices[0].cardmarket_price) * m.quantity;
                    mainPrice.current.tcgplayer_price += Number(m.card.card_prices[0].tcgplayer_price) * m.quantity;
                    mainPrice.current.ebay_price += Number(m.card.card_prices[0].ebay_price) * m.quantity;
                    mainPrice.current.amazon_price += Number(m.card.card_prices[0].amazon_price) * m.quantity;
                    mainPrice.current.coolstuffinc_price += Number(m.card.card_prices[0].coolstuffinc_price) * m.quantity;
                }

                mainPrice.current.cardmarket_price = formatPrice(mainPrice.current.cardmarket_price);
                mainPrice.current.tcgplayer_price = formatPrice(mainPrice.current.tcgplayer_price);
                mainPrice.current.ebay_price = formatPrice(mainPrice.current.ebay_price);
                mainPrice.current.amazon_price = formatPrice(mainPrice.current.amazon_price);
                mainPrice.current.coolstuffinc_price = formatPrice(mainPrice.current.coolstuffinc_price);

                for (let m of extraList) {
                    extraPrice.current.cardmarket_price += Number(m.card.card_prices[0].cardmarket_price) * m.quantity;
                    extraPrice.current.tcgplayer_price += Number(m.card.card_prices[0].tcgplayer_price) * m.quantity;
                    extraPrice.current.ebay_price += Number(m.card.card_prices[0].ebay_price) * m.quantity;
                    extraPrice.current.amazon_price += Number(m.card.card_prices[0].amazon_price) * m.quantity;
                    extraPrice.current.coolstuffinc_price += Number(m.card.card_prices[0].coolstuffinc_price) * m.quantity;
                }

                extraPrice.current.cardmarket_price = formatPrice(extraPrice.current.cardmarket_price);
                extraPrice.current.tcgplayer_price = formatPrice(extraPrice.current.tcgplayer_price);
                extraPrice.current.ebay_price = formatPrice(extraPrice.current.ebay_price);
                extraPrice.current.amazon_price = formatPrice(extraPrice.current.amazon_price);
                extraPrice.current.coolstuffinc_price = formatPrice(extraPrice.current.coolstuffinc_price);

                for (let m of sideList) {
                    sidePrice.current.cardmarket_price += Number(m.card.card_prices[0].cardmarket_price) * m.quantity;
                    sidePrice.current.tcgplayer_price += Number(m.card.card_prices[0].tcgplayer_price) * m.quantity;
                    sidePrice.current.ebay_price += Number(m.card.card_prices[0].ebay_price) * m.quantity;
                    sidePrice.current.amazon_price += Number(m.card.card_prices[0].amazon_price) * m.quantity;
                    sidePrice.current.coolstuffinc_price += Number(m.card.card_prices[0].coolstuffinc_price) * m.quantity;
                }

                sidePrice.current.cardmarket_price = formatPrice(sidePrice.current.cardmarket_price);
                sidePrice.current.tcgplayer_price = formatPrice(sidePrice.current.tcgplayer_price);
                sidePrice.current.ebay_price = formatPrice(sidePrice.current.ebay_price);
                sidePrice.current.amazon_price = formatPrice(sidePrice.current.amazon_price);
                sidePrice.current.coolstuffinc_price = formatPrice(sidePrice.current.coolstuffinc_price);

                if (deck.img) {
                    setSelectedImage(deck.img);
                }

                setCroppedImages(images);
                setFullList([mainList, extraList, sideList]);
            }

            setIsInfoLoading(false);
        };

        async function searchByCode(code) {
            try {
                const value = await AsyncStorage.getItem(code);

                if (value !== null) {
                    return JSON.parse(value);
                } else {
                    return await fetchCard(code);
                }
            } catch (e) {
                    console.log('Error searching code', code, 'in database' );
            }
        }

        if (deck) {
            loadDeckContents();
        }
    }, [deck, wait]);

    const formatPrice = (price) => {
        return Math.round(price * 100) / 100;
    };

    const showCards = () => {
        const mainDeck = [...fullList[0]];
        const extraDeck = [...fullList[1]];
        const sideDeck = [...fullList[2]];

        return (
            <>
                {mainDeck.length > 0 &&
                <View style={styles.deckContainer}>
                    <View style={styles.deckTypeContainer}>
                        <Text style={styles.deckType}>Main deck</Text>
                    </View>
                    <View style={styles.cardsContainer}>
                        {getCards(mainDeck)}
                    </View>
                </View>
                }
                {extraDeck.length > 0 &&
                <View style={styles.deckContainer}>
                    <View style={styles.deckTypeContainer}>
                        <Text style={styles.deckType}>Extra deck</Text>
                    </View>
                    <View style={styles.cardsContainer}>
                        {getCards(extraDeck)}
                    </View>
                </View>
                }
                {sideDeck.length > 0 &&
                <View style={styles.deckContainer}>
                    <View style={styles.deckTypeContainer}>
                        <Text style={styles.deckType}>Side deck</Text>
                    </View>
                    <View style={styles.cardsContainer}>
                        {getCards(sideDeck)}
                    </View>
                </View>
                }
            </>
        );
    };

    const getCards = (deckList) => {
        let cards = [];

        for (let i = 0; i < deckList.length; i++) {
            let card = deckList[i];
            for (let j = 1; j <= card.quantity; j++) {
                cards.push(<Image key={i.toString() + j.toString()} style={styles.cardImage} source={{uri: card.card.card_images[0].image_url}}/>);
            }
        }

        return cards;
    };

    async function fetchCard(code) {
        try {
            let url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + code;

            const cardInfo = await fetch(url);
            if (cardInfo.ok) {
                const res = await cardInfo.json();
                const cardData = res.data[0];

                const name = JSON.stringify(cardData.name);
                const desc = JSON.stringify(cardData.desc);

                cardData.desc = [];
                cardData.name = [];

                cardData.desc.push(JSON.parse('{"en":' + desc + '}'));
                cardData.name.push(JSON.parse('{"en":' + name + '}'));

                await AsyncStorage.setItem(code, JSON.stringify(cardData));
                return cardData;
            }
            else {
                return null;
            }
        }
        catch (e){
          console.log(e);
        }
    }

    const shareDeck = async () => {
        setWait(true);
        if (deck.url) {
            setQrUrl(deck.url);
        } else {
            const url = await postNew(deck.content);
            setQrUrl(url);
        }
        setTimeout(() => {
            setShowQR(true);
            setWait(false);
        }, 1000);
    };

    const getToken = async () => {
        const response = await fetch('https://rentry.co', {
            headers: {
                'Referer': 'https://rentry.co',
            },
        });

        const cookie_data = response.headers.map['set-cookie'].split(';');
        for (let i = 0; i < cookie_data.length; i++) {
            cookie_data[i] = cookie_data[i].trim().split('=');
            if (cookie_data[i][0] === 'csrftoken') {
                return cookie_data[i][1];
            }
        }
        return null;
    };

    const postNew = async (paste_content) => {
        try {
            const csrftoken = await getToken();

            const formData = new FormData();
            formData.append('csrfmiddlewaretoken', csrftoken);
            formData.append('url', '');
            formData.append('edit_code', 'ygo_tools');
            formData.append('text', paste_content);

            const response = await fetch('https://rentry.co/api/new', {
                method: 'POST',
                headers: {
                    'Referer': 'https://rentry.co',
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': csrftoken,
                },
                body: formData,
            });
            const response_data = await response.json();

            const url = response_data.url;

            const decks = await AsyncStorage.getItem('decks');
            const parsedDecks = JSON.parse(decks);

            const updatedDeck = deck;
            updatedDeck.url = url;

            const exists = deckExists(parsedDecks, deck.name);

            parsedDecks[exists.index] = updatedDeck;

            await AsyncStorage.setItem('decks', JSON.stringify(parsedDecks));

            setDeck(updatedDeck);

            return url;
        } catch (e) {
            console.log('Error while creating new url. Please try again');
            setWait(false);
        }
    };

    const deleteDeck = async () => {
        setDeleteConfirmation(false);
        setWait(true);
        try {
            const result = await AsyncStorage.getItem('decks');

            if (result) {
                let decks = JSON.parse(result);
                const index = deckExists(decks, text.trim()).index;
                const url = decks[index].url;
                if (index >= 0) {
                    decks.splice(index, 1);
                    await AsyncStorage.setItem('decks', JSON.stringify(decks));
                    if (url) {
                        await deleteDeckPaste(url);
                    }
                    setShowOptions(false);
                    setTimeout(() => {
                        setWait(false);
                        navigation.goBack();
                    }, 1000);
                }
            }
        } catch (e) {
            console.log('Error while deleting deck or pasted data');
            setTimeout(() => {
                setWait(false);
            }, 1000);
        }
    };

    const deleteDeckPaste = async (url) => {
        const csrftoken = await getToken();

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);
        formData.append('edit_code', 'ygo_tools');
        formData.append('text', '');
        formData.append('delete', 'delete');

        await fetch(url + '/edit', {
            method: 'POST',
            headers: {
                'Referer': 'https://rentry.co',
                'Content-Type': 'multipart/form-data',
                'X-CSRFToken': csrftoken,
            },
            body: formData,
        });
    };

    const saveDeck = async () => {
        try {
            setWait(true);
            const value = await AsyncStorage.getItem('decks');

            let decks;

            if (!value) {
                decks = [];
            } else {
                decks = JSON.parse(value);
                if (deckExists(decks, text.trim()).exists) {
                    setShowWrongName(true);
                    return;
                }
            }

            setShowInputName(false);

            if (route.params.new) {
                let newDeck = {};

                newDeck.name = text.trim();
                newDeck.content = deck ? getDeckContent() : '';
                newDeck.cards = deck ? mainDeckCardNumber.current : 0;

                decks.push(newDeck);
                setDeck(newDeck);
            } else {
                const actualDeck = decks[deckExists(decks, nameToEdit.current).index];
                actualDeck.name = text.trim();
                setDeck(actualDeck);
            }

            await AsyncStorage.setItem('decks', JSON.stringify(decks));

            nameToEdit.current = text.trim();

            setSaved(true);
            setShowWrongName(false);

            setWait(false);

            setSavedConfirmation(true);
            setTimeout(() => {

                setSavedConfirmation(false);
            }, 1500);
        } catch (e) {
          console.log(e);
          setWait(false);
        }
    };

    const getDeckContent = () => {
        let deckContent = '';

        deckContent += '#main\n';
        for (let card of fullList[0]) {
            for (let i = 1; i <= card.quantity; i++){
                deckContent += (card.card.id + '\n');
                mainDeckCardNumber.current++;
            }
        }

        deckContent += '#extra\n';
        for (let card of fullList[1]) {
            for (let i = 1; i <= card.quantity; i++){
                deckContent += (card.card.id + '\n');
            }
        }

        deckContent += '!side\n';
        for (let card of fullList[2]) {
            for (let i = 1; i <= card.quantity; i++){
                deckContent += (card.card.id + '\n');
            }
        }

        return deckContent;
    };

    const deckExists = (decks, name) => {
        for (let i = 0; i < decks.length; i++) {
            if (decks[i].name === name) {
                return {exists: true, index: i};
            }
        }
        return {exists: false, index: -1};
    };

    const updateDeckImg = async () => {
        try {
            setShowImgZones(false);
            setShowImages(false);
            setWait(true);

            const value = await AsyncStorage.getItem('decks');

            if (value) {
                let decks = JSON.parse(value);
                const myDeck = deckExists(decks, nameToEdit.current);
                if (myDeck.exists) {
                    decks[myDeck.index].img = selectedImage;
                    decks[myDeck.index].imgZone = topPercent.current;
                    await AsyncStorage.setItem('decks', JSON.stringify(decks));
                    setWait(false);
                    setSavedConfirmation(true);

                    setTimeout(() => {
                        setDeck(decks[myDeck.index]);
                        setSavedConfirmation(false);
                    }, 1500);
                }
            } else {
                console.log('Deck does not exist');
                setWait(false);
            }
        } catch (e) {
          console.log('Saved decks could not be accessed');
          setWait(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg} resizeMode={'cover'}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Icon color="#fffc" name="arrow-left" size={deviceWidth * 0.08} type="material-community"/>
                    </TouchableOpacity>
                    <Text adjustsFontSizeToFit={true} style={styles.headerText}>{nameToEdit.current}</Text>
                    {
                    !isInfoLoading &&
                        <View style={styles.headerButtonContainer}>
                        {
                        route.params.new && !saved && nameToEdit.current &&
                        <>
                        <View style={styles.headerButton}/>
                        <TouchableOpacity style={styles.headerButton} onPress={() => setShowInputName(true)} disabled={saved}>
                            <Icon color="#fffc" name="content-save" size={deviceWidth * 0.08} type="material-community"/>
                        </TouchableOpacity>
                        </>
                        }
                        {
                        (!route.params.new || saved) &&
                        <>
                        {
                        fullList &&
                        <>
                        {
                        (fullList[0].length > 0 || fullList[1].length > 0 || fullList[2].length > 0) &&
                            <TouchableOpacity style={styles.headerButton} onPress={() => {
                                    setShowOptions(false);
                                    shareDeck();
                                }}>
                                <Icon color="#fffc" name="md-qr-code-outline" size={deviceWidth * 0.08} type="ionicon"/>
                            </TouchableOpacity>
                        }
                        {fullList[0].length > 0 &&
                            <TouchableOpacity style={styles.headerButton} onPress={() => {
                                    setShowOptions(false);
                                    setDrawTest(true);
                                }}>
                                <Icon color="#fffc" name="cards" size={deviceWidth * 0.08} type="material-community"/>
                            </TouchableOpacity>
                        }
                        </>
                        }
                        <TouchableOpacity style={[styles.headerButton, {opacity: showOptions ? 0.5 : 1, backgroundColor: showOptions ? '#000000c0' : 'transparent'}]} onPress={() => setShowOptions(!showOptions)}>
                            <Icon color="#fffc" name="menu" size={deviceWidth * 0.08} type="material-community"/>
                        </TouchableOpacity>
                        </>
                        }
                        </View>
                    }
                </View>
                {
                isInfoLoading &&
                <View style={styles.loading}>
                    <ActivityIndicator size={120} color={'#ffffffb0'}/>
                </View>
                }
                {
                !isInfoLoading &&
                <>
                    {
                    showOptions &&
                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionContainer} onPress={() => {
                            setShowOptions(false);
                            setShowInputName(true);
                        }}>
                            <Text style={styles.optionText}>Change deck name</Text>
                        </TouchableOpacity>
                        {
                        croppedImages && croppedImages.length > 0 &&
                        <TouchableOpacity style={styles.optionContainer} onPress={() => {
                            setShowOptions(false);
                            setShowImages(true);
                        }}>
                            <Text style={styles.optionText}>Change deck image</Text>
                        </TouchableOpacity>
                        }
                        <TouchableOpacity style={styles.optionContainer} onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('DeckListEditor', {name: nameToEdit.current, deckList: fullList});
                        }}>
                            <Text style={styles.optionText}>Modify deck list</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.optionContainer, {borderBottomLeftRadius: 8, gap: 8}]} onPress={() => {
                            setShowOptions(false);
                            setDeleteConfirmation(true);
                        }}>
                            <Text style={[styles.optionText, {color: '#f55'}]}>Delete deck</Text>
                            <Icon color="#f55" name="warning" size={20} type="material"/>
                        </TouchableOpacity>
                    </View>
                    }
                    {(showInputName || !nameToEdit.current) &&
                    <View style={styles.confirmContainer}>
                        <View style={styles.confirmFrame}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.confirmTitle}>Save as</Text>
                            </View>
                            <TextInput style={styles.deckNameInput} selectionColor={'#fff'} autoFocus={true} maxLength={20} value={text} selectTextOnFocus={true} onChangeText={(value) => {
                                setText(value);
                                setShowWrongName(false);
                            }}/>
                            {
                            showWrongName &&
                            <Text style={styles.wrongName}>A deck with that name already exists</Text>
                            }
                            <View style={styles.buttonsContainer}>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => {
                                    if (!nameToEdit.current) {
                                        navigation.goBack();
                                    }
                                    setShowInputName(false);
                                    setShowWrongName(false);
                                }}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.confirmButton, {opacity: text.trim().length > 0 ? 1 : 0.5}]} disabled={!text.length > 0} onPress={() => {
                                    if (!wait) {
                                        saveDeck();
                                    }
                                }}>
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    }
                    {
                    showQR && qrUrl &&
                    <View style={styles.qrContainer}>
                        <QRCode size={Math.min(qrSize, 400)} value={qrUrl} quietZone={16} />
                        <TouchableOpacity onPress={() => setShowQR(false)} activeOpacity={0.75}>
                            <Icon color="#fffa" name="close-o" size={72} type="evilicon"/>
                        </TouchableOpacity>
                    </View>
                    }
                    {
                    showImages &&
                    <View style={styles.imgsContainer}>
                        <View style={styles.imgsFrame}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.imgsTitle}>Choose image</Text>
                            </View>
                            <ScrollView>
                            {croppedImages &&
                            <View style={styles.croppedImgsContainer}>
                                {
                                croppedImages.map((img, index) => {
                                    return (
                                        <TouchableHighlight activeOpacity={1} underlayColor={'transparent'} onPress={() => setSelectedImage(img)} key={img + index}
                                        style={[styles.imgSquare, {backgroundColor: img === selectedImage ? '#88ddff' : 'transparent'}]}>
                                            <Image style={styles.imgElement} source={{uri: img}} onError={e => {
                                                const arr = [...croppedImages];
                                                arr.splice(index, 1);
                                                setCroppedImages(arr);
                                            }}/>
                                        </TouchableHighlight>
                                    );
                                })
                                }
                            </View>
                            }
                            </ScrollView>
                            <View style={[styles.buttonsContainer, {marginTop: '5%'}]}>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => setShowImages(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => setShowImgZones(true)}>
                                    <Text style={styles.buttonText}>Accept</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    }
                    {
                    deleteConfirmation &&
                    <View style={styles.confirmContainer}>
                        <View style={styles.confirmFrame}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.confirmTitle}>Warning</Text>
                                <Icon color="#ffffff" name="alert-circle-outline" size={22} type="material-community" style={{marginLeft: 4}}/>
                            </View>
                            <Text style={styles.confirmText}>Delete '{text}' from your decks?</Text>
                            <View style={styles.buttonsContainer}>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => setDeleteConfirmation(false)}>
                                    <Text style={styles.buttonText}>No</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => deleteDeck()}>
                                    <Text style={styles.buttonText}>Yes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    }
                    {
                    savedConfirmation &&
                    <View style={styles.confirmContainer}>
                        <View style={[styles.confirmFrame, {height: '25%', justifyContent: 'center', alignItems: 'center'}]}>
                            <Icon color="#0f9" name="check-circle-outline" size={72} type="material-community"/>
                            <Text style={styles.deckSavedText}>Deck saved!</Text>
                        </View>
                    </View>
                    }
                    {
                    wait &&
                    <View style={styles.wait}>
                        <ActivityIndicator color={'#ffffff'} size={64}/>
                        <Text style={styles.waitText}>Please wait...</Text>
                    </View>
                    }
                    {
                    showImgZones &&
                    <View style={styles.imageZonesContainer}>
                        <View style={styles.imageZonesFrame}>
                            <View ref={myCropper} onLayout={event => {
                                        myCropper.current.measure((x, y, width, height, pageX, pageY) => {
                                            setDraggableInfo({
                                                width: width,
                                                height: height,
                                                x: x,
                                                y: y - height * 2 / 3,
                                                minX: x,
                                                minY: y - height * 2 / 3,
                                                maxX: x + width,
                                                maxY: y + height * 2 / 3 + height,
                                            });
                                        });
                                    }}>
                                <ImageBackground style={styles.imageZones} source={{uri: selectedImage}}>
                                    {!draggableInfo &&
                                        <View style={styles.wait}>
                                            <ActivityIndicator color={'#ffffff'} size={32}/>
                                            <Text style={styles.waitText}>Please wait...</Text>
                                        </View>
                                    }
                                    {draggableInfo &&
                                    <Draggable renderText=""
                                    x={draggableInfo.x} y={draggableInfo.y} minX={draggableInfo.minX}
                                    minY={draggableInfo.minY} maxX={draggableInfo.maxX} maxY={draggableInfo.maxY}
                                    onDragRelease={(event, gestureState, bounds) => {
                                        topPercent.current = Math.ceil((bounds.top + draggableInfo.height * 2 / 3) / draggableInfo.height * 300);
                                    }}>
                                            <TouchableOpacity activeOpacity={1}>
                                                <View style={{backgroundColor: '#0008', width: draggableInfo.width, height: draggableInfo.height * 2 / 3}} />
                                                <View style={[styles.imageZone, {width: draggableInfo.width}]}/>
                                                <View style={{backgroundColor: '#0008', width: draggableInfo.width, height: draggableInfo.height * 2 / 3}} />
                                            </TouchableOpacity>
                                        </Draggable>
                                    }
                                </ImageBackground>
                            </View>
                            <View style={styles.buttonsContainer}>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => {
                                    setShowImgZones(false);
                                }}>
                                    <Text style={styles.buttonText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmButton} onPress={() => {
                                    updateDeckImg();
                                }}>
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    }
                    {
                    <ScrollView contentContainerStyle={{minHeight: '92%'}} onTouchStart={() => setShowOptions(false)}>
                        {
                            fullList && (fullList[0].length > 0 || fullList[1].length > 0 || fullList[2].length > 0) &&
                            showCards()
                        }
                        {
                            (!fullList || (fullList && fullList[0].length === 0 && fullList[1].length === 0 && fullList[2].length === 0)) &&
                            <View style={styles.emptyMsgContainer}>
                                <View style={styles.emptyMsg}>
                                    <Image source={require('../../assets/no-card-found.png')} resizeMode="contain" style={{height: '50%'}}/>
                                    <Text style={styles.emptyText}>NO CARDS FOUND</Text>
                                </View>
                            </View>
                        }
                    </ScrollView>
                    }
                    {fullList && drawTest &&
                    <DrawTest deck={fullList[0]} setDrawTest={setDrawTest}/>
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
    },
    image: {
        height: '100%',
    },
    header: {
        width: '100%',
        height: '8%',
        backgroundColor: '#232436',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: '12.5%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        width: '50%',
        maxHeight: '75%',
        fontFamily: 'Roboto',
        fontSize: 26,
        color: '#fff',
        fontWeight: 700,
    },
    headerButtonContainer: {
        width: '37.5%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    headerButton: {
        width: '33.333%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loading: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        position: 'absolute',
        top: '8%',
        right: 0,
        zIndex: 500,
        backgroundColor: '#121325',
        borderTopWidth: 1,
        borderTopColor: '#010214',
        borderBottomLeftRadius: 8,
    },
    optionContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#232436',
        padding: deviceWidth * 0.05,
    },
    optionText: {
        color: '#ffffffc0',
        fontSize: 20,
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
        color: '#ffffffc0',
    },
    deckNameInput: {
        borderWidth: 1,
        borderColor: '#ffffff30',
        backgroundColor: '#00000030',
        fontSize: 24,
        paddingHorizontal: 12,
        marginBottom: '5%',
        color: '#ffffffc0',
    },
    wrongName: {
        fontSize: 16,
        marginBottom: 12,
        color: '#f40',
        fontStyle: 'italic',
        fontWeight: 600,
    },
    confirmText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        fontWeight: 600,
        color: '#ffffff',
        marginBottom: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'flex-end',
        gap: deviceWidth * 0.02,
    },
    confirmButton: {
        alignSelf: 'flex-end',
        justifyContent: 'center',
        paddingVertical: '2%',
        paddingHorizontal: '4%',
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Roboto',
        textAlign: 'center',
        color: '#ffdd00',
    },
    deckSavedText: {
        fontSize: 48,
        color: '#fff',
    },
    wait: {
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
    waitText: {
        fontFamily: 'Roboto',
        fontSize: 32,
        color: '#ffffff',
        marginTop: '5%',
    },
    imageZonesContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageZonesFrame: {
        width: '80%',
        padding: '5%',
        backgroundColor: '#232436',
        gap: deviceWidth * 0.05,
    },
    imageZones: {
        width: '100%',
        aspectRatio: 1,
        overflow: 'hidden',
    },
    imageZone: {
        aspectRatio: 3,
    },
    zoneButtonsContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: '5%',
    },
    zoneButton: {
        width: '33.33%',
        padding: '5%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoneButtonText: {
        color: '#fffc',
        fontSize: Math.max(16, deviceWidth * 0.0185),
    },
    emptyMsgContainer: {
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
        width: '100%',
        color: '#ffffff',
        fontFamily: 'Roboto',
        fontSize: 36,
        fontWeight: 700,
        marginTop: '5%',
        fontStyle: 'italic',
    },
    deckContainer: {
        padding: '5%',
    },
    deckTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '5%',
    },
    deckType: {
        fontSize: 32,
        fontWeight: 700,
        color: '#ffffff',
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    imgRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    cardImage: {
        height: deviceWidth * 0.9 * 0.16666 / 0.686,
        aspectRatio: 0.686,
    },
    qrContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#000000c0',
        position: 'absolute',
        zIndex: 500,
    },
    imgsContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000000c0',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imgsFrame: {
        width: '80%',
        height: '40%',
        padding: '5%',
        backgroundColor: '#232436',
    },
    imgsTitle: {
        fontSize: 22,
        color: 'white',
    },
    croppedImgsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    imgSquare: {
        height: deviceWidth * 0.7 * 0.3333,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imgElement: {
        width: '90%',
        aspectRatio: 1,
    },
});

export default DeckViewerScreen;

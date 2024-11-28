/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, DeviceEventEmitter, Dimensions, FlatList, Image, ImageBackground,
    StyleSheet, Text, TextInput, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/themed';
import QRCode from 'react-native-qrcode-svg';
import Draggable from 'react-native-draggable/Draggable';
import { DrawTest } from '@/components/DrawTest';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { Prompt } from '@/components/Prompt';

const deviceWidth = Dimensions.get('window').width;

export default function DeckViewer() {
    DeviceEventEmitter.addListener('event.updateDeck', editedDeck => {
        setDeck(editedDeck);
    });

    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    const qrSize = deviceWidth * 0.6;

    const bg = require('../assets/images/bg.png');

    const [isInfoLoading, setIsInfoLoading] = useState(false);
    const [showInputName, setShowInputName] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [text, setText] = useState('');
    const [saved, setSaved] = useState(false);
    const [showWrongName, setShowWrongName] = useState(false);
    const [savedConfirmationMessage, setSavedConfirmationMessage] = useState(false);
    const [wait, setWait]  = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);
    const [showImages, setShowImages] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrUrl, setQrUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [fullList, setFullList] = useState<any[]>([[],[],[]]);
    const [deck, setDeck] = useState<any>(null);
    const [croppedImages, setCroppedImages] = useState<any[]>([]);
    const [drawTest, setDrawTest] = useState(false);
    const [showImgZones, setShowImgZones] = useState(false);
    const [draggableInfo, setDraggableInfo] = useState<any>(null);
    const [showMessage, setShowMessage] = useState(false);
    const [showLargerCard, setShowLargerCard] = useState(false);

    const mainDeckCardNumber = useRef(0);
    const nameToEdit = useRef('');
    const topPercent = useRef(0);
    const errorMessage = useRef('');
    const cardToEnlarge = useRef('');
    const initialRef: any = null;
    const nameInput = useRef(initialRef);
    const myCropper = useRef(initialRef);

    const params = useLocalSearchParams();

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
        if (params.new) {
            if (!params.deck) {
                setIsInfoLoading(false);
                return;
            }
        }

        if (typeof params.deck === "string") {
            const parsedDeck = JSON.parse(params.deck);
            nameToEdit.current = parsedDeck.name;
            setText(nameToEdit.current);
            setDeck(parsedDeck);
        }
    }, []);

    useEffect(() => {
        const loadDeckContents = async () => {
            if (deck && deck.content.length > 0) {

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

                if (deck.img) {
                    setSelectedImage(deck.img);
                }

                setCroppedImages(images);
                if (mainList.length > 0 || extraList.length > 0 || sideList.length > 0) {
                    setFullList([mainList, extraList, sideList]);
                    setIsInfoLoading(false);
                }
                else {
                    setTimeout(() => {
                        router.navigate({pathname: 'deck-explorer', params: {deckWasInvalid: 1}});
                        setIsInfoLoading(false);
                    }, 1500);
                }
            }
            else {
                setIsInfoLoading(false);
            }
        };

        async function searchByCode(code:string) {
            try {
                const value = await AsyncStorage.getItem(code);

                if (value !== null) {
                    return JSON.parse(value);
                } else {
                    return await fetchCard(code);
                }
            } catch (e) {
                errorMessage.current = 'Error while searching code ' + code + ' in database';
                setShowMessage(true);
            }
        }

        if (deck) {
            loadDeckContents();
        }
    }, [deck, wait]);

    useEffect(() => {
        if (showInputName) {
            nameInput.current.focus();
        }
    }, [showInputName])

    const showCards = () => {
        const mainDeck = [...fullList[0]];
        const extraDeck = [...fullList[1]];
        const sideDeck = [...fullList[2]];

        let output: any[] = [];

        if (mainDeck.length > 0) {
            const mainCards = getCards(mainDeck);
            output.push (
                <View style={[styles.deckTypeContainer, {marginTop: 0}]}>
                    <Text style={styles.deckType}>Main deck</Text>
                    <Text style={styles.deckTotal}>{mainCards.total} cards</Text>
                </View>
            );
            const cards = mainCards.cards;
            let rowCards: any = [];
            for (let i = 0; i < cards.length; i++) {
                rowCards.push(cards[i]);
                if ((i + 1) % 4 === 0 || i === cards.length - 1) {
                    output.push (
                        <View style={styles.cardRow}>
                            {[...rowCards]}
                        </View>
                    )
                    rowCards = [];
                }
            }
        }

        if (extraDeck.length > 0) {
            const extraCards = getCards(extraDeck);
            output.push (
                <View style={styles.deckTypeContainer}>
                    <Text style={styles.deckType}>Extra deck</Text>
                    <Text style={styles.deckTotal}>{extraCards.total} cards</Text>
                </View>
            );
            const cards = extraCards.cards;
            let rowCards: any = [];
            for (let i = 0; i < cards.length; i++) {
                rowCards.push(cards[i]);
                if ((i + 1) % 4 === 0 || i === cards.length - 1) {
                    output.push (
                        <View style={styles.cardRow}>
                            {[...rowCards]}
                        </View>
                    )
                    rowCards = [];
                }
            }
        }

        if (sideDeck.length > 0) {
            const mainCards = getCards(sideDeck);
            output.push (
                <View style={styles.deckTypeContainer}>
                    <Text style={styles.deckType}>Side deck</Text>
                    <Text style={styles.deckTotal}>{mainCards.total} cards</Text>
                </View>
            );
            const cards = mainCards.cards;
            let rowCards: any = [];
            for (let i = 0; i < cards.length; i++) {
                rowCards.push(cards[i]);
                if ((i + 1) % 4 === 0 || i === cards.length - 1) {
                    output.push (
                        <View style={styles.cardRow}>
                            {[...rowCards]}
                        </View>
                    )
                    rowCards = [];
                }
            }
        }

        return output;
    };

    const getCards = (deckList: any[]) => {
        let total = 0;
        const cards: any[] = [];
        for (let card of deckList) {
            for (let i = 1; i <= card.quantity; i++) {
                total++;
                cards.push(
                    <View key={card.card.card_images[0].image_url + i}>
                        <Image style={styles.cardImage} source={{uri: card.card.card_images[0].image_url}}/>
                        <TouchableOpacity style={styles.enlargeButton}
                            onPress={() => {
                                cardToEnlarge.current = card.card.card_images[0].image_url;
                                setShowLargerCard(true);
                            }}>
                                <Icon type="material" name="zoom-out-map" size={28} color={"#000"} />
                        </TouchableOpacity>
                    </View>
                )
            }
        }
        return {cards: cards, total : total};
    };

    async function fetchCard(code:string) {
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
            errorMessage.current = 'Card information could not be retrieved. Please try again';
            setShowMessage(true);
        }
    }

    const shareDeck = async () => {
        setWait(true);
        if (deck.url) {
            const url = deck.url;
            const actualUrl = url.includes('/raw') ? url : (url.charAt(url.length - 1) === '/' ? (url + 'raw') : (url + '/raw'));
            const response = await fetch(actualUrl, {
                headers: {
                    'Referer': 'https://rentry.co',
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain',
                    'rentry-auth': `${process.env.EXPO_PUBLIC_AUTH_CODE}`,
                },
            });
            if (response.ok) {
                setQrUrl(deck.url);
            }
            else {
                const url = await postNew(deck.content);
                setQrUrl(url);
            }
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

        const headers:any = response.headers;
        const cookie_data = headers.map['set-cookie'].split(';');
        for (let i = 0; i < cookie_data.length; i++) {
            const actualCookie = cookie_data[i].trim().split('=');
            if (actualCookie[0] === 'csrftoken') {
                return actualCookie[1];
            }
        }
        return null;
    };

    const postNew = async (paste_content:string) => {
        try {
            const csrftoken = await getToken();

            const formData = new FormData();
            if (typeof csrftoken === "string"){
                formData.append('csrfmiddlewaretoken', csrftoken);
            }
            formData.append('url', '');
            formData.append('edit_code', 'ygo_tools');
            formData.append('text', paste_content);

            const response = await fetch('https://rentry.co/api/new', {
                method: 'POST',
                headers: {
                    'Referer': 'https://rentry.co',
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': typeof csrftoken === "string" ? csrftoken : '',
                },
                body: formData,
            });
            const response_data = await response.json();

            const url = response_data.url;

            const decks = await AsyncStorage.getItem('decks');
            
            if (typeof decks === "string") {
                const parsedDecks = JSON.parse(decks);

                const updatedDeck = deck;
                updatedDeck.url = url;

                const exists = deckExists(parsedDecks, deck.name);

                parsedDecks[exists.index] = updatedDeck;

                await AsyncStorage.setItem('decks', JSON.stringify(parsedDecks));

                setDeck(updatedDeck);

                return url;
            }
        } catch (e:any) {
            errorMessage.current = 'Error while creating deck URL. Please try again';
            setShowMessage(true);
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
                        router.back();
                    }, 1000);
                }
            }
        } catch (e) {
            errorMessage.current = 'Error while deleting deck or pasted data. Please try again';
            setShowMessage(true);
            setTimeout(() => {
                setWait(false);
            }, 1000);
        }
    };

    const deleteDeckPaste = async (url:string) => {
        const csrftoken = await getToken();

        const formData = new FormData();
        if (typeof csrftoken === "string") {
            formData.append('csrfmiddlewaretoken', csrftoken);
        }
        formData.append('edit_code', 'ygo_tools');
        formData.append('text', '');
        formData.append('delete', 'delete');

        await fetch(url + '/edit', {
            method: 'POST',
            headers: {
                'Referer': 'https://rentry.co',
                'Content-Type': 'multipart/form-data',
                'X-CSRFToken': typeof csrftoken === "string" ? csrftoken : '',
            },
            body: formData,
        });
    };

    const saveDeck = async () => {
        try {
            const value = await AsyncStorage.getItem('decks');

            let decks = [];

            if (value) {
                decks = JSON.parse(value);
                const existingDeck = deckExists(decks, text.trim());
                if (existingDeck.exists) {
                    setShowWrongName(true);
                    return;
                }
            }
            setShowInputName(false);
            setWait(true);

            if (Number(params.new) === 1) {
                const newDeck = {
                    name: text.trim(),
                    content: deck ? getDeckContent() : '',
                    cards: deck ? mainDeckCardNumber.current : 0
                }
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

            setSavedConfirmationMessage(true);
            setTimeout(() => {
                setSavedConfirmationMessage(false);
            }, 1500);
        } catch (e) {
            errorMessage.current = 'Error while saving deck data. Please try again';
            setShowMessage(true);
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

    const deckExists = (decks:any, name:string) => {
        for (let i = 0; i < decks.length; i++) {
            if (decks[i].name === name) {
                return {exists: true, index: i};
            }
        }
        return {exists: false, index: -1};
    };

    const getCroppedDeckImages = () => {
        const imgs:any[] = [];
        croppedImages.map((img:any, index:number) => {
            imgs.push(
                <TouchableHighlight activeOpacity={1} underlayColor={'transparent'} onPress={() => setSelectedImage(img)} key={img + index}
                style={[styles.imgSquare, {backgroundColor: img === selectedImage ? '#88ddff' : 'transparent'}]}>
                    <Image style={styles.imgElement} source={{uri: img}} onError={(e:any) => {
                        const arr = [...croppedImages];
                        arr.splice(index, 1);
                        setCroppedImages(arr);
                    }}/>
                </TouchableHighlight>
            );
        })
        return imgs;
    }

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
                    setSavedConfirmationMessage(true);

                    setTimeout(() => {
                        setDeck(decks[myDeck.index]);
                        setSavedConfirmationMessage(false);
                    }, 1500);
                }
                else {
                    errorMessage.current = 'Deck does not exist';
                    setShowMessage(true);
                    setWait(false);
                }
            } else {
                errorMessage.current = 'No decks stored';
                setShowMessage(true);
                setWait(false);
            }
        } catch (e) {
            errorMessage.current = 'Stored decks data could not be accessed. Please try again';
            setShowMessage(true);
            setWait(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg} resizeMode={'cover'}>
                <View style={styles.header}>
                    <View style={styles.headerLeftContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Icon color="#fffc" name="arrow-left" size={deviceWidth * 0.06} type="material-community"/>
                        </TouchableOpacity>
                        <Text adjustsFontSizeToFit={true} style={styles.headerText}>{nameToEdit.current}</Text>
                    </View>
                    {
                    !isInfoLoading &&
                        <View style={styles.headerButtonContainer}>
                        {
                        (Number(params.new) === 1 && !saved && nameToEdit.current !== '') &&
                        <>
                            <TouchableOpacity style={styles.headerButton} 
                                onPress={() => {
                                        setShowInputName(true);
                                    }
                                }
                                disabled={saved}>
                                <Icon color="#fff" name="content-save" size={deviceWidth * 0.06} type="material-community"/>
                            </TouchableOpacity>
                        </>
                        }
                        {
                        ((Number(params.new) === 0) || saved) &&
                        <>
                        {
                        fullList.length > 0 &&
                        <>
                        {
                        (fullList[0].length > 0 || fullList[1].length > 0 || fullList[2].length > 0) &&
                            <TouchableOpacity style={styles.headerButton} onPress={() => {
                                    setShowOptions(false);
                                    shareDeck();
                                }}>
                                <Icon color="#fffc" name="qr-code-outline" size={deviceWidth * 0.06} type="ionicon"/>
                            </TouchableOpacity>
                        }
                        {fullList[0].length > 0 &&
                            <TouchableOpacity style={styles.headerButton} onPress={() => {
                                    setShowOptions(false);
                                    setDrawTest(true);
                                }}>
                                <Icon color="#fffc" name="cards" size={deviceWidth * 0.06} type="material-community"/>
                            </TouchableOpacity>
                        }
                        </>
                        }
                        <TouchableOpacity style={[styles.headerButton, {opacity: showOptions ? 0.5 : 1, backgroundColor: showOptions ? '#000000c0' : 'transparent'}]} onPress={() => setShowOptions(!showOptions)}>
                            <Icon color="#fffc" name="menu" size={deviceWidth * 0.06} type="material-community"/>
                        </TouchableOpacity>
                        </>
                        }
                        </View>
                    }
                </View>
                {
                isInfoLoading &&
                <View style={styles.loading}>
                    <ActivityIndicator size={120} color={'#fffb'}/>
                    <Text style={styles.loadingText}>Getting your cards, please wait...</Text>
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
                            router.navigate({pathname: 'decklist-editor', params: {name: nameToEdit.current, deckList: JSON.stringify(fullList)}});
                        }}>
                            <Text style={styles.optionText}>Modify deck list</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.optionContainer, {borderBottomLeftRadius: 8, gap: 8}]} onPress={() => {
                            setShowOptions(false);
                            setDeleteConfirmation(true);
                        }}>
                            <Text style={[styles.optionText, {color: '#f55'}]}>
                                {'Delete deck '}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    }
                    {showMessage &&
                    <Prompt description={errorMessage.current} type={'ok'}
                        okAction={() => {
                            setShowMessage(false);
                            router.back();
                        }} />
                    }
                    {(showInputName || nameToEdit.current === '') &&
                    <View style={styles.confirmContainer}>
                        <View style={styles.confirmFrame}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.confirmTitle}>Save as</Text>
                            </View>
                            <TextInput ref={nameInput} style={styles.deckNameInput} selectionColor={'#fff5'} maxLength={20} value={text} selectTextOnFocus={true} onChangeText={(value) => {
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
                                        router.back();
                                    }
                                    setShowInputName(false);
                                    setShowWrongName(false);
                                }}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.confirmButton, {opacity: text.trim().length > 0 ? 1 : 0.5}]} disabled={!(text.length > 0)} onPress={() => {
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
                        <QRCode size={Math.min(qrSize, 250)} value={qrUrl} quietZone={16} />
                        <TouchableOpacity onPress={() => setShowQR(false)} activeOpacity={0.75}>
                            <Icon color="#ffffffc0" name="close" size={Math.min(deviceWidth * 0.09, 48)} type="material-community"/>
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
                            {croppedImages &&
                            <FlatList
                                numColumns={3}
                                data={getCroppedDeckImages()}
                                renderItem={({item}) => item}
                            />
                            }
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
                    <Prompt description={'Delete \'' + text + '\' from your decks?'} type='yesno' yesAction={() => deleteDeck()} noAction={() => setDeleteConfirmation(false)} />
                    }
                    {
                    savedConfirmationMessage &&
                    <View style={styles.confirmContainer}>
                        <View style={styles.savedFrame}>
                            <Text style={styles.deckSavedText}>Deck saved!</Text>
                            <Icon color="#0f9" name="check" size={40} type="material-community"/>
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
                                        myCropper.current.measure((x:number, y:number, width:number, height:number, pageX:number, pageY:number) => {
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
                                    onDragRelease={(event:any, gestureState:any, bounds?:any) => {
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
                    showLargerCard &&
                    <View style={styles.largerCardContainer}>
                        <Image style={styles.largeCardImage} source={{uri: cardToEnlarge.current}}/>
                        <TouchableOpacity onPress={() => setShowLargerCard(false)}>
                            <Icon color="#ffffffc0" name="highlight-off" size={Math.min(deviceWidth * 0.15, 48)} type="material"/>
                        </TouchableOpacity>
                    </View>
                    }
                    {fullList.length > 0 && (fullList[0].length > 0 || fullList[1].length > 0 || fullList[2].length > 0) &&
                    <FlatList
                        data={showCards()}
                        renderItem={({item}) => item}
                        onTouchStart={() => setShowOptions(false)}
                        contentContainerStyle={{padding: '5%', gap: 4}}
                    />
                    }
                    {(!(fullList.length > 0) || !(fullList[0].length > 0 || fullList[1].length > 0 || fullList[2].length > 0)) &&
                        <View style={styles.emptyMsgContainer}>
                            <View style={styles.emptyMsg}>
                                <Image source={require('../assets/images/no-card-found.png')} resizeMode="contain" style={{height: '50%'}}/>
                                <Text style={styles.emptyText}>NO CARDS FOUND</Text>
                            </View>
                        </View>
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
        backgroundColor: '#232436',
    },
    image: {
        height: '100%',
    },
    header: {
        width: '100%',
        height: '6%',
        backgroundColor: '#232436',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeftContainer: {
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: deviceWidth * 0.1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        width: deviceWidth * 0.6,
        maxHeight: '75%',
        fontFamily: 'Roboto-700',
        fontSize: 24,
        color: '#fff',
    },
    headerButtonContainer: {
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    headerButton: {
        width: deviceWidth * 0.1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loading: {
        height: '92%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Roboto-700',
        fontSize: 24,
        color: '#fffb',
        marginTop: '3%',
    },
    optionsContainer: {
        position: 'absolute',
        top: '6%',
        right: 0,
        zIndex: 500,
        flexDirection: 'column',
        gap: 1,
        backgroundColor: '#454658',
        borderTopColor: '#010214',
        borderBottomLeftRadius: 8,
    },
    optionContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#232436',
        padding: deviceWidth * 0.03,
    },
    optionText: {
        fontFamily: 'Roboto',
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
    savedFrame: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '5%',
    },
    confirmTitle: {
        fontSize: 22,
        fontFamily: 'Roboto-700',
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
        fontFamily: 'Roboto-600',
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
    largerCardContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 600,
        backgroundColor: '#000c',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    largeCardImage: {
        width: '75%',
        aspectRatio: 0.686,
    },
    deckSavedText: {
        fontSize: 32,
        color: '#fff',
    },
    wait: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000c',
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
        color: '#fff',
        fontFamily: 'Roboto-700',
        fontSize: 36,
        marginTop: '5%',
        fontStyle: 'italic',
    },
    deckTypeContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: '#fff',
        marginVertical: '5%',
    },
    deckType: {
        fontSize: 28,
        fontFamily: 'Roboto-700',
        color: '#fff',
    },
    deckTotal: {
        fontSize: 20,
        fontFamily: 'Roboto-600',
        color: '#fff',
        marginBottom: 2,
    },
    cardRow: {
        flexDirection: 'row',
        gap: 4,
    },
    cardImage: {
        height: Math.floor((deviceWidth * 0.9 - 12) * 0.25 / 0.686),
        aspectRatio: 0.686,
    },
    enlargeButton: {
        width: '100%',
        height: '100%',
        paddingRight: Math.ceil(deviceWidth * 0.01),
        position:'absolute',
        top: 0,
        left: 0,
        zIndex: 600,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '5%',
    },
    cardTextContainer: {
        width: Math.ceil(deviceWidth - deviceWidth * 0.9 * 0.16666 - deviceWidth * 0.1 - 12),
        justifyContent: 'center',
    },
    cardText: {
        fontFamily: 'Roboto-600',
        color: '#fff',
        fontSize: 26,
    },
    qrContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#000c',
        position: 'absolute',
        zIndex: 500,
    },
    imgsContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000c',
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
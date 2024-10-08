import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, DeviceEventEmitter, Dimensions, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '@rneui/themed';
import { EditorCard } from '@/components/EditorCard';
import {SearchCardName} from '@/components/SearchCardName';
import { Header } from '@/components/Header';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { Prompt } from '@/components/Prompt';

const deviceWidth = Dimensions.get('window').width;

export default function DeckListEditor() {
    const bg = require('../assets/images/bg.png');

    const MAX_SIZES = [60, 15, 15];

    const [loaded, error] = useFonts({
        'Roboto-800': require('../assets/fonts/Roboto-800.ttf'),
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    const [isInfoLoading, setIsInfoLoading] = useState(true);
    const [enterName, setEnterName] = useState(false);
    const [deckIndexToEdit, setDeckIndexToEdit] = useState(-1);
    const [changed, setChanged] = useState(0);
    const [wait, setWait]  = useState(false);
    const [savedConfirmationMessage, setSavedConfirmationMessage] = useState(false);
    const [removeCardConfirmation, setRemoveCardConfirmation] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const language = useRef('');
    const nameToEdit = useRef('');
    const errorMessage = useRef('');
    const sizes = useRef([0, 0, 0]);
    const deckList = useRef<any[]>([]);
    const initialRef: any = null;
    const cardToRemove = useRef(initialRef);
    const deckListClone = useRef(initialRef);

    const params = useLocalSearchParams();

    useEffect(() => {
        const backAction = () => {
            if (enterName) {
                setEnterName(false);
                return true;
            } else if (changed > 0) {
                setShowConfirm(true);
                return true;
            }
        };

          const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
          );
          return () => backHandler.remove();
    }, [changed, enterName]);

    useEffect(() => {
        if (typeof params.name === "string") {
            nameToEdit.current = params.name;
        }

        if (params.deckList && typeof params.deckList === "string" && !deckListClone.current) {
            deckList.current = JSON.parse(params.deckList);
            deckListClone.current = JSON.parse(JSON.stringify(deckList.current));
            sizes.current = countCards(deckList.current);
        } else {
            sizes.current = [0, 0, 0];
        }
        setIsInfoLoading(false);
    }, [params.deckList, params.name]);

    function countCards(deckList: any[]) {
        let countArray = [];
        
        for (let deck of deckList) {
            let count = 0;
            for (let card of deck) {
                count += card.quantity;
            }
            countArray.push(count);
        }

        return countArray;
    }

    const showCardRemovalMessage = (name:string, deckIndex:number, cardIndex:number) => {
        cardToRemove.current = {name: name, deckIndex: deckIndex, cardIndex: cardIndex};
        setRemoveCardConfirmation(true);
    };

    const removeCard = () => {
        setWait(true);
        const modifiedDeck = deckListClone.current[cardToRemove.current.deckIndex];
        modifiedDeck.splice(cardToRemove.current.cardIndex, 1);
        deckListClone.current[cardToRemove.current.deckIndex] = modifiedDeck;
        setTimeout(() => {
            setWait(false);
            setChanged(changed + 1);
        }, 1000);
    };

    const elementsToRender = () => {
        let elements = [];

        if (deckListClone.current) {
            for (let i = 0; i < deckListClone.current.length; i++) {
                const deck = deckListClone.current[i];
                elements.push(
                    <View key={i} style={[styles.deckTypeContainer, {marginTop: i === 0 ? 0 : '5%'}]}>
                        <Text key={'d' + i} style={styles.deckType}>
                            {i === 0 ? 'Main' : i === 1 ? 'Extra' : 'Side'} Deck
                        </Text>
                        <Text style={styles.deckTotal}>{sizes.current[i]} cards</Text>
                    </View>
                );
                getDeck(elements, i, deck)
                elements.push(
                    <View key={'d.' + i} style={styles.addButtonContainer}>
                        <TouchableHighlight disabled={!(sizes.current[i] < MAX_SIZES[i])} underlayColor={'#e0bb3f'}
                        style={[styles.addButton, {opacity: sizes.current[i] < MAX_SIZES[i] ? 1 : 0.5}]} onPress={() => {
                            setDeckIndexToEdit(i);
                            setEnterName(true);
                        }}>
                            <Text style={styles.addText}>ADD CARDS TO {i === 0 ? 'MAIN' : i === 1 ? 'EXTRA' : 'SIDE'} DECK</Text>
                        </TouchableHighlight>
                    </View>
                );
            }
        } else {
            for (let i = 0; i < 3; i++) {
                elements.push(
                    <View key={'empty' + i}>
                        <View style={styles.deckTypeContainer}>
                            <Text style={styles.deckType}>
                                {i === 0 ? 'Main' : i === 1 ? 'Extra' : 'Side'} Deck
                            </Text>
                        </View>
                        <View style={styles.emptyMsg}>
                            <Image source={require('../assets/images/no-card-found.png')} style={{height: deviceWidth * 0.9 * 0.25, aspectRatio: 0.8362}}/>
                            <Text style={styles.emptyText}>NO CARDS FOUND</Text>
                        </View>
                        <View key={'md'} style={styles.addButtonContainer}>
                            <TouchableHighlight underlayColor={'#e0bb3f'} style={styles.addButton} onPress={() => {
                                setDeckIndexToEdit(i);
                                setEnterName(true);
                            }}>
                                <Text style={styles.addText}>ADD CARDS TO {i === 0 ? 'MAIN' : i === 1 ? 'EXTRA' : 'SIDE'} DECK</Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                );
            }
        }
        return elements;
    };

    const getDeck = (elements: any[], index: number, actualDeck: any[]) => {
        if (actualDeck.length > 0) {
            let count = 0;

            for (let j = 0; j < actualDeck.length; j++) {
                const c = actualDeck[j];
                count += c.quantity;
                elements.push(
                    <EditorCard key={'d' + index + 'c' + j} img={c.card.card_images[0].image_url}
                    name={c.card.name[0][language.current] ? c.card.name[0][language.current] : c.card.name[0].en} quantity={c.quantity}
                    deckIndex={index} cardIndex={j} showCardRemovalMessage={showCardRemovalMessage} updateDeckSize={updateDeckSize}
                    canAddCopies={sizes.current[index] < MAX_SIZES[index]} />
                );
            }

            sizes.current[index] = count;
        } else {
            elements.push(
                <View style={styles.emptyMsg}>
                    <Image source={require('../assets/images/no-card-found.png')} style={{height: deviceWidth * 0.9 * 0.25, aspectRatio: 0.8362}}/>
                    <Text style={styles.emptyText}>NO CARDS FOUND</Text>
                </View>
            );
        }
    };

    const addCard = (item:any) => {
        if (!deckListClone.current) {
            deckListClone.current = [[], [], []];
        }

        if (sizes.current[deckIndexToEdit] < MAX_SIZES[deckIndexToEdit]) {
            const card = item;
            const name = JSON.stringify(card.name);
            const desc = JSON.stringify(card.desc);

            card.name = [];
            card.desc = [];

            card.name.push(JSON.parse('{"' + language.current + '":' + name + '}'));
            card.desc.push(JSON.parse('{"' + language.current + '":' + desc + '}'));

            deckListClone.current[deckIndexToEdit].push({card: item, quantity: 1});
            sizes.current[deckIndexToEdit] = sizes.current[deckIndexToEdit] + 1;

            sortDeck(deckIndexToEdit);
            setChanged(changed + 1);

            return true;
        }
        return false;
    };

    const filterSearch = (card:any) => {
        let supportedTypes:string[] = [];

        if (deckIndexToEdit === 0) {
            supportedTypes = ['normal', 'effect', 'ritual', 'spell', 'trap'];
        } else if (deckIndexToEdit === 1) {
            supportedTypes = ['fusion', 'synchro', 'xyz', 'link'];
        } else if (deckIndexToEdit === 2) {
            supportedTypes = ['normal', 'effect', 'ritual', 'spell', 'trap', 'fusion', 'synchro', 'xyz', 'link'];
        }

        let result = false;

        for (let sp of supportedTypes) {
            if (!result) {
                result = card.frameType.toLowerCase().includes(sp);
            }
        }

        if (deckListClone.current){
            result &&= !isCardIncludedInDeck(deckListClone.current[deckIndexToEdit], card);
        }

        return result;
    };

    const isCardIncludedInDeck = (deck:any[], card:any) => {
        for (let c of deck) {
            if (c.card.id.toString() === card.id.toString()){
                return true;
            }
        }
        return false;
    };

    const updateDeckSize = (deckIndex:number, cardIndex:number, quantity:number) => {
        (deckListClone.current[deckIndex][cardIndex]).quantity += quantity;
        sizes.current[deckIndex] += quantity;
        setChanged(changed + 1);
    };

    const saveChanges = async () => {
        try {
            setWait(true);
            const value = await AsyncStorage.getItem('decks');

            if (value) {
                const name = nameToEdit.current;
                let decks = JSON.parse(value);

                const doDeckExists = deckExists(decks, name);

                if (doDeckExists.exists) {
                    const myDeckIndex = doDeckExists.index;

                    const deckData = getDeckData();
                    decks[myDeckIndex].content = deckData.content;
                    decks[myDeckIndex].cards = deckData.cards;

                    if (decks[myDeckIndex].img) {
                        let hasCards = false;
                        for (let deck of deckListClone.current) {
                            if (!hasCards) {
                                hasCards = deck.length > 0;
                            }
                        }
                        if (!hasCards) {
                            delete decks[myDeckIndex].img;
                        }
                    }

                    await AsyncStorage.setItem('decks', JSON.stringify(decks));

                    const url = decks[doDeckExists.index].url;
                    if (url) {
                        await editDeckPaste(url, deckData.content);
                    }

                    deckList.current = deckListClone.current;
                    DeviceEventEmitter.emit('event.updateDeck', decks[doDeckExists.index]);
                    DeviceEventEmitter.removeAllListeners('event.updateDeck');

                    setWait(false);
                    setSavedConfirmationMessage(true);
                    setTimeout(() => {
                        setChanged(0);
                        setSavedConfirmationMessage(false);
                    }, 1500);
                } else {
                    errorMessage.current = 'Deck does not exist';
                    setShowMessage(true);
                    setWait(false);
                }
            }
            else {
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

    const getToken = async () => {
        const response = await fetch('https://rentry.co', {
            headers: {
                'Referer': 'https://rentry.co',
            },
        });

        const headers:any = response.headers;
        const cookie_data = headers.map['set-cookie'].split(';')
        for (let i = 0; i < cookie_data.length; i++) {
            cookie_data[i] = cookie_data[i].trim().split('=');
            if (cookie_data[i][0] === 'csrftoken') {
                return cookie_data[i][1];
            }
        }

        return null;
    };

    const editDeckPaste = async (url:string, newText:string) => {
        const csrftoken = await getToken();

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);
        formData.append('edit_code', 'ygo_tools');
        formData.append('text', newText);

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

    const getDeckData = () => {
        let cards = 0;

        let main = '#main\n';
        for (let card of deckListClone.current[0]) {
            for (let i = 1; i <= card.quantity; i++){
                main += (card.card.id + '\n');
                cards++;
            }
        }

        let extra = '#extra\n';
        for (let card of deckListClone.current[1]) {
            for (let i = 1; i <= card.quantity; i++){
                extra += (card.card.id + '\n');
            }
        }

        let side = '!side\n';
        for (let card of deckListClone.current[2]) {
            for (let i = 1; i <= card.quantity; i++){
                side += (card.card.id + '\n');
            }
        }

        return {content: main + extra + side, cards: cards};
    };

    const deckExists = (decks:any[], name:string) => {
        for (let i = 0; i < decks.length; i++) {
            if (decks[i].name === name) {
                return {exists: true, index: i};
            }
        }
        return {exists: false, index: -1};
    };

    const sortDeck = (index:number) => {
        if (deckListClone.current[index].length > 1) {
            deckListClone.current[index] = deckListClone.current[index].sort(compareCards);
        }
    };

    const compareCards = (a:any, b:any) => {
        const monsterFrames = ['normal', 'effect', 'fusion',
                                'ritual', 'synchro', 'xyz', 'link'];

        const frameA = a.card.frameType.replace('_pendulum', '');
        const frameB = b.card.frameType.replace('_pendulum', '');

        const aIndex = monsterFrames.indexOf(frameA);
        const bIndex = monsterFrames.indexOf(frameB);

        if (aIndex >= 0) {  // a is monster
            if (bIndex < 0) {   // b is not monster
                return -1;
            }
            else {  // Both monsters
                const comparedIndex = aIndex - bIndex;
                if (comparedIndex !== 0) {
                    return comparedIndex;
                }
                else {
                    return compareMonsters(a, b);
                }
            }
        } else {          // a is not monster
            if (bIndex >= 0) {   // b is monster
                return 1;
            } else { // No monsters
                if (a.card.frameType === b.card.frameType) {
                    if (a.card.frameType === 'spell') {
                        return compareSpells(a, b);
                    } else {
                        return compareTraps(a, b);
                    }
                } else {
                    return a.card.frameType === 'spell' ? -1 : 1;
                }
            }
        }
    };

    const compareMonsters = (a:any, b:any) => {
        const comparedLevel = b.card.level - a.card.level;

        if (comparedLevel !== 0) {
            return comparedLevel;
        } else {
            const aAtk = Number(a.card.atk);
            const bAtk = Number(b.card.atk);

            if (!isNaN(aAtk) && !isNaN(bAtk)) {   // a & b ATK is not ?
                const comparedAtk = bAtk - aAtk;
                if (comparedAtk !== 0) {
                    return comparedAtk;
                } else {
                    const aDef = Number(a.card.def);
                    const bDef = Number(b.card.def);

                    if (!isNaN(aDef) && !isNaN(bDef)) {   // a & b ATK is not ?
                        const comparedDef = bDef - aDef;
                        if (comparedDef !== 0) {
                            return comparedDef;
                        } else {
                            return a.card.id - b.card.id;
                        }
                    }
                    else {
                        if (isNaN(aDef) && isNaN(bDef)) {
                            return a.card.id - b.card.id;
                        } else {
                            return (isNaN(bDef) ? -1 : 1);
                        }
                    }
                }
            }
            else {
                if (isNaN(aAtk) && isNaN(bAtk)) {
                    return a.card.id - b.card.id;
                } else {
                    return (isNaN(bAtk) ? -1 : 1);
                }
            }
        }
    };

    const compareSpells = (a:any, b:any) => {
        const spellRaces = ['normal', 'ritual', 'quick-play', 'continuous', 'equip', 'field'];

        const raceA = a.card.race.toLowerCase();
        const raceB = b.card.race.toLowerCase();

        const aIndex = spellRaces.indexOf(raceA);
        const bIndex = spellRaces.indexOf(raceB);

        const comparedIndex = aIndex - bIndex;

        if (comparedIndex !== 0) {
            return comparedIndex;
        } else {
            return a.card.id - b.card.id;
        }
    };

    const compareTraps = (a:any, b:any) => {
        const trapRaces = ['normal', 'continuous', 'counter'];

        const raceA = a.card.race.toLowerCase();
        const raceB = b.card.race.toLowerCase();

        const aIndex = trapRaces.indexOf(raceA);
        const bIndex = trapRaces.indexOf(raceB);

        const comparedIndex = aIndex - bIndex;

        if (comparedIndex !== 0) {
            return comparedIndex;
        } else {
            return a.card.id - b.card.id;
        }
    };

    const headerGoBackFunction = () => {
        if (changed > 0) {
            setShowConfirm(true);
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground style={styles.image} source={bg} resizeMode={'cover'}>
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
                    removeCardConfirmation &&
                    <Prompt
                    description={`Remove ${cardToRemove.current.name} from ${cardToRemove.current.deckIndex === 0? 'main' : cardToRemove.current.deckIndex === 1 ? 'extra' : 'side'} deck?`}
                    type={'yesno'}
                    noAction={() => setRemoveCardConfirmation(false)}
                    yesAction={() =>
                        {
                            setRemoveCardConfirmation(false);
                            removeCard();
                        }
                    } />
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
                    {showMessage &&
                    <Prompt description={errorMessage.current} type={'ok'} okAction={() => {
                        setShowMessage(false);
                        router.back();
                    }} />
                    }
                    {
                    !enterName &&
                    <>
                        <Header title={'Deck editor'} goBackFunction={() => headerGoBackFunction()}
                        firstIcon={'content-save'} firstSize={deviceWidth * 0.08} firstFunction={() => saveChanges()} firstDisabled={changed <= 0}
                        firstStyle={{opacity: changed > 0 ? 1 : 0.5, backgroundColor: changed > 0 ? '#0c6' : 'transparent'}}/>
                        <FlatList
                            data={elementsToRender()} 
                            renderItem={({item}) => item}
                            contentContainerStyle={{padding: '5%', gap: 4}}
                        />
                    </>
                    }
                    {
                    showConfirm &&
                    <Prompt
                        description='Do you want to leave? All your unsaved changes will be discarded'
                        type={'yesno'}
                        noAction={() => setShowConfirm(false)}
                        yesAction={() =>
                            {
                                setShowConfirm(false);
                                router.back();
                            }
                        } />
                    }
                    {
                    enterName &&
                    <SearchCardName cardSelectionFunction={addCard} showEnterNameFunction={setEnterName} cardElementIcon="card-plus"
                    cardIconTransform={{transform: [{rotate: '-90deg'}]}} cardSearchFilter={filterSearch} showToast={true}/>
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
    loading: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 32,
        fontFamily: 'Roboto-700',
        color: '#fff',
    },
    deckTotal: {
        fontSize: 20,
        fontFamily: 'Roboto-600',
        color: '#fff',
        marginBottom: 2,
    },
    emptyMsg: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: '10%',
        opacity: 0.65,
    },
    emptyText: {
        width: '100%',
        color: '#ffffff',
        fontFamily: 'Roboto-700',
        fontSize: 24,
        marginTop: '2%',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    addButtonContainer: {
        padding: '3%',
    },
    addButton: {
        padding: '5%',
        alignItems: 'center',
        backgroundColor: '#f0df83',
        borderRadius: 10,
    },
    addText: {
        fontSize: 22,
        fontFamily: 'Roboto-800',
        color: '#232436',
    },
});

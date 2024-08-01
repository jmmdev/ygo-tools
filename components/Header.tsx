import { useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@rneui/themed';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';

export function Header ({title, goBackFunction, canSearch, inputSubmitFunction, inputPlaceHolder, onHideSearchFunction,
                 firstIcon, firstSize, firstFunction, firstStyle, firstDisabled,
                 secondIcon, secondSize, secondFunction,
                 thirdIcon, thirdSize, thirdFunction}
                 :{title: string, goBackFunction?: any, canSearch?: boolean, inputSubmitFunction?: any, inputPlaceHolder?: string, onHideSearchFunction?: any,
                    firstIcon?: string, firstSize?: number, firstFunction?: any, firstStyle?: any, firstDisabled?: boolean,
                    secondIcon?: string, secondSize?: number, secondFunction?: any,
                    thirdIcon?: string, thirdSize?: number, thirdFunction?: any}){

    const [search, setSearch] = useState(false);
    const [text, setText] = useState('');
    const [showClear, setShowClear] = useState(false);
    const searched = useRef(false);
    const lastSearch = useRef('');

    const targetButton = useRef(-1);

    const initialRef: any = null;
    const myTextInput = useRef<TextInput>(initialRef);

    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight = Dimensions.get('window').height;

    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
    });

    let numButtons = 0;

    if (firstIcon) {
        numButtons++;
    }
    if (secondIcon) {
        numButtons++;
    }
    if (thirdIcon) {
        numButtons++;
    }

    const inputStyles = StyleSheet.create({
        headerButtonContainer: {
            width: deviceWidth * 0.125 * numButtons,
            height: '100%',
            flexDirection: 'row',
            justifyContent: 'flex-end',
        },
        headerButton: {
            width: deviceWidth * 0.125,
            height: '100%',
            justifyContent: 'center',
        },
        headerText: {
            width:
                numButtons > 0
                ? deviceWidth * 0.5 + ((3 - numButtons) * deviceWidth * 0.125)
                : deviceWidth * 0.5 + ((3 - numButtons) * deviceWidth * 0.125) - deviceWidth * 0.05,
            maxHeight: deviceHeight * 0.04,
            fontFamily: 'Roboto-700',
            fontSize: 26,
            color: '#ffffff',
        },
        inputStyle: {
            width: deviceWidth * 0.85,
            maxWidth: deviceWidth * 0.875,
            height: '75%',
            maxHeight: '75%',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#00000060',
            borderRadius: 200,
        },
    });

    
    useEffect(() => {
        const backAction = () => {
            if (search) {
                if (searched.current && onHideSearchFunction) {
                    searched.current = false;
                    onHideSearchFunction();
                }

                setSearch(false);
                lastSearch.current = '';
                setText('');
                return true;
            }
            else if (goBackFunction) {
                goBackFunction();
                return true;
            }
        };

          const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
          );
          return () => backHandler.remove();
    }, [goBackFunction, onHideSearchFunction, search]);

    useEffect(() => {
        if (canSearch) {
            if (firstIcon && firstIcon.toLowerCase().includes('search')) {
                targetButton.current = 0;
            }
            else if (secondIcon && secondIcon.toLowerCase().includes('search')) {
                targetButton.current = 1;
            }
            else if (thirdIcon && thirdIcon.toLowerCase().includes('search')) {
                targetButton.current = 2;
            }
        }
    }, [canSearch, firstIcon, secondIcon, thirdIcon]);

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
                if (search) {
                    if (searched.current && onHideSearchFunction) {
                        searched.current = false;
                        onHideSearchFunction();
                    }

                    setSearch(false);
                    lastSearch.current = '';
                    setText('');
                }
                else {
                    goBackFunction ? goBackFunction() : router.back();
                }
            }}>
                <Icon color="#fffc" name="arrow-left" size={deviceWidth * 0.08} type="material-community"/>
            </TouchableOpacity>
            {!search &&
            <Text style={inputStyles.headerText}>{title}</Text>
            }
            {search &&
            <View style={inputStyles.inputStyle}>
                <TextInput style={[styles.nameInput, {fontStyle: text.length > 0 ? 'normal' : 'italic'}]}
                onFocus={() => setShowClear(text.length > 0)} ref={myTextInput} value={text} onChangeText={(value) => {
                    setText(value);
                    setShowClear(value.length > 0);
                }} onSubmitEditing={() => {
                    setShowClear(false);
                    const searchText = text.trim().toLowerCase();
                    if (searchText.length > 0 && searchText !== lastSearch.current) {
                        searched.current = true;
                        lastSearch.current = searchText;
                        inputSubmitFunction((text.trim()).toLowerCase());
                    }
                }}
                selectionColor={'#ffffff68'} autoFocus={true} placeholderTextColor={'#fff4'} placeholder={inputPlaceHolder} />
                {text.length > 0 && showClear &&
                <TouchableOpacity style={styles.closeButton} onPress={() => {
                    setText('');
                    myTextInput.current.focus();
                }}>
                    <Icon color="#fffc" name="close-circle" size={Math.max(deviceWidth * 0.05, 26)} type="material-community"/>
                </TouchableOpacity>}
            </View>
            }
            
            <View style={inputStyles.headerButtonContainer}>
                {firstIcon && !search &&
                <TouchableOpacity style={[inputStyles.headerButton, firstStyle]} onPress={canSearch && targetButton.current === 0 ? () => setSearch(!search) : firstFunction}
                disabled={firstDisabled}>
                    <Icon color={firstStyle ? '#fff' : '#fffc'} name={firstIcon} size={firstSize} type="material-community"/>
                </TouchableOpacity>
                }
                {secondIcon && !search &&
                <TouchableOpacity style={inputStyles.headerButton} onPress={canSearch && targetButton.current === 1 ? () => setSearch(!search) : secondFunction}>
                    <Icon color="#fffc" name={secondIcon} size={secondSize} type="ionicon"/>
                </TouchableOpacity>
                }
                {thirdIcon && !search &&
                <TouchableOpacity style={inputStyles.headerButton} onPress={canSearch && targetButton.current === 2 ? () => setSearch(!search) : thirdFunction}>
                    <Icon color="#fffc" name={thirdIcon} size={thirdSize} type="material-community"/>
                </TouchableOpacity>
                }
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        width: '100%',
        height: '8%',
        backgroundColor: '#232436',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: '12.5%',
        height: '100%',
        justifyContent: 'center',
    },
    nameInput: {
        width: '85%',
        height: '80%',
        fontFamily: 'Roboto',
        fontSize: 24,
        color: '#ffffff',
        padding: 0,
        paddingLeft: '5%',
    },
    closeButton: {
        height: '100%',
        marginHorizontal: '2.5%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
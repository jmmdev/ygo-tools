/* eslint-disable react-native/no-inline-styles */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useRef, useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Icon} from '@rneui/themed';
import { useIsFocused } from '@react-navigation/native';

const deviceWidth = Dimensions.get('window').width;

const CardInfoScreen = ({navigation, route}) => {
  const LANG_IMAGES = {
    en: require('../../assets/en.png'),
    fr: require('../../assets/fr.png'),
    de: require('../../assets/de.png'),
    it: require('../../assets/it.png'),
    pt: require('../../assets/pt.png'),
  };
  const LANGUAGES = [
    {code: 'en', img: LANG_IMAGES.en},
    {code: 'fr', img: LANG_IMAGES.fr},
    {code: 'de', img: LANG_IMAGES.de},
    {code: 'it', img: LANG_IMAGES.it},
    {code: 'pt', img: LANG_IMAGES.pt},
  ];
  const [language, setLanguage] = useState('en');
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [data, setData] = useState(null);
  const errorMessage = useRef(null);
  const [showMessage, setShowMessage] = useState(false);
  const translationError = useRef(null);
  const [showTranslationError, setShowTranslationError] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const isFocused = useIsFocused();

  const bgImg = require('../../assets/bg.png');

  useEffect(() => {
      async function fetchCard(code, lg) {
        try {
          let url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + code;

          if (lg !== 'en') {
            url += '&language=' + lg;
          }
          setLanguage(lg);

          fetch(url).then(cardInfo => {
            if (cardInfo.ok) {
                cardInfo.json().then(async res => {
                    const cardData = res.data[0];

                    const name = JSON.stringify(cardData.name);
                    const desc = JSON.stringify(cardData.desc);

                    cardData.desc = [];
                    cardData.name = [];

                    cardData.desc.push(JSON.parse('{"' + lg + '":' + desc + '}'));
                    cardData.name.push(JSON.parse('{"' + lg + '":' + name + '}'));

                    await AsyncStorage.setItem(code, JSON.stringify(cardData));
                    setData(cardData);
                    setIsInfoLoading(false);
                });
            }
            else {
                errorMessage.current = 'The card with code ' + code + ' doesn\'t exist. Please check it again.';
                setShowMessage(true);
                setIsInfoLoading(false);
            }
          })
          .catch((e) => {
              errorMessage.current = 'Card information could not be retrieved. Please try again';
              setShowMessage(true);
              setIsInfoLoading(false);
          });
        }
        catch (e){
          errorMessage.current = 'There was an unexpected error. Please try again';
          setShowMessage(true);
          setIsInfoLoading(false);
        }
    }

    async function searchByCode(code) {
      try {
          const value = await AsyncStorage.getItem(code);

          if (value !== null) {
            setData(JSON.parse(value));
            setIsInfoLoading(false);
          } else {
            await fetchCard(code, 'en');
          }
      } catch (e) {
          errorMessage.current = 'Error searching code ' + code + ' in database';
          setShowMessage(true);
          setIsInfoLoading(false);
      }
  }
        searchByCode(route.params.id);
    }, [isFocused, route.params.id, route.params.language]);

  async function selectLanguage(lg) {
    if (lg !== language) {
      setShowLanguages(false);
      setIsTranslationLoading(true);
      const id = route.params.id;

      try {
        const value = await AsyncStorage.getItem(id);

        if (value != null){
          const parsedValue = JSON.parse(value);

          if (!(lg in parsedValue.name[0])) {
            fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + id + (lg !== 'en' ? ('&language=' + lg) : ''))
            .then(cardInfo => {
              if (cardInfo.ok) {
                cardInfo.json().then(translation => {
                  try {
                    let translations = (JSON.stringify(parsedValue.desc[0])).slice(0, -1);
                    let names = (JSON.stringify(parsedValue.name[0])).slice(0, -1);

                    const desc = JSON.stringify(translation.data[0].desc);
                    const name = JSON.stringify(translation.data[0].name);

                    translations += ', "' + lg + '":' + desc + '}';
                    names += ', "' + lg + '":' + name + '}';
                    parsedValue.desc[0] = JSON.parse(translations);
                    parsedValue.name[0] = JSON.parse(names);

                    AsyncStorage.setItem(id, JSON.stringify(parsedValue)).then(() => {
                      setData(parsedValue);
                      setLanguage(lg);
                      setIsTranslationLoading(false);
                    });
                } catch (e) {
                  setIsTranslationLoading(false);
                }
                });
              } else {
                translationError.current = 'No translation available';
                setShowTranslationError(true);
                setIsTranslationLoading(false);
              }
            })
            .catch((error) => {
              console.log(error);
              setIsTranslationLoading(false);
            });
          } else {
            setLanguage(lg);
            setShowLanguages(false);
            setIsTranslationLoading(false);
          }
        } else {
          setIsTranslationLoading(false);
        }
      } catch (e) {
          console.log(e);
      }
    }
  }

  const doShowLanguages = () => {
    setShowLanguages(!showLanguages);
  };

  const displayLanguageList = () => {
    return (
      <View style={[styles.lgContainer, {opacity: showLanguages ? 1 : 0}]}>
        {LANGUAGES.map((lg, index) => {
          if (lg.code !== language) {
            return (
              <TouchableOpacity key={index} style={[styles.lgButton]} onPress={() => showLanguages ? selectLanguage(lg.code) : {}} activeOpacity={1} disabled={isTranslationLoading}>
                <Image style={styles.lgImg} source={lg.img}/>
              </TouchableOpacity>
            );
          }
        })}
      </View>
    );
  };

  const attributeStyle = StyleSheet.create({
    attribute: {
      fontFamily: 'Roboto',
      fontSize: Math.max(22, deviceWidth * 0.0254),
      fontWeight: 700,
      color: data && (data.attribute === 'FIRE' ? 'red' :
            data.attribute === 'WATER' ? '#00aacc' :
            data.attribute === 'WIND' ? '#00cc66' :
            data.attribute === 'EARTH' ? '#886f00' :
            (data.attribute === 'LIGHT' || data.attribute === 'DIVINE') ? '#ffee00' :
            data.attribute === 'DARK' ? '#aa55ff' :
            'white'),
    },
  });

  return (
      <ImageBackground source={bgImg}  resizeMode="cover" style={[styles.image, showMessage && {alignItems: 'center'} , (isInfoLoading || showMessage) && {justifyContent: 'center'}]}>
        {isInfoLoading &&
        <ActivityIndicator size={120} color={'#fffb'}/>}
        {!isInfoLoading && showMessage &&
          <View style={styles.errorFrame}>
            <View style={styles.titleContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Icon color="#fff" name="alert-circle-outline" size={22} type="material-community"/>
              </View>
              <Text style={styles.errorText}>{errorMessage.current}</Text>
              <TouchableOpacity style={styles.errorDismiss} onPress={() => {
                  setShowMessage(false);
                  navigation.goBack();
                }
              }>
                  <Text style={styles.errorOkay}>OK</Text>
              </TouchableOpacity>
          </View>}
          {
          !isInfoLoading && showTranslationError &&
          <View style={styles.errorContainer}>
            <View style={styles.errorFrame}>
              <View style={styles.titleContainer}>
                  <Text style={styles.errorTitle}>Error</Text>
                  <Icon color="#fff" name="alert-circle-outline" size={22} type="material-community"/>
                </View>
                <Text style={styles.errorText}>{translationError.current}</Text>
                <TouchableOpacity style={styles.errorDismiss} onPress={() => {
                    setShowTranslationError(false);
                  }
                }>
                    <Text style={styles.errorOkay}>OK</Text>
                </TouchableOpacity>
            </View>
          </View>
          }
        {!isInfoLoading && !showMessage && data &&
        <>
          <TouchableOpacity activeOpacity={0.5} style={styles.button} onPress={() => navigation.goBack()}>
            <Icon color="#fff" name="arrow-back" size={Math.max(40, deviceWidth * 0.07)} type="material"/>
          </TouchableOpacity>
          <View style={styles.container}>
            <View style={styles.imgContainer}>
              <Image style={styles.cardImg} source={{uri: data.card_images[0].image_url}} />
              <View style={{width: Math.min(deviceWidth * 0.15, 64), justifyContent: 'center', alignItems: 'center'}}>
                <TouchableOpacity style={styles.showLgButton} onPress={() => doShowLanguages()} activeOpacity={0.5}>
                  <Image style={styles.lgImg} source={LANG_IMAGES[language]}/>
                </TouchableOpacity>
                {displayLanguageList()}
              </View>
            </View>
          </View>
          <ScrollView persistentScrollbar={true} contentContainerStyle={{paddingHorizontal: '5%', paddingBottom: '5%'}}>
            {isTranslationLoading &&
            <ActivityIndicator style={{height: 250}} size={100} color={'#ffffffb0'}/>}
            {!isTranslationLoading && data &&
            <>
            <View>
              <Text style={styles.name}>{(data.name[0][language]).toUpperCase()}</Text>
              <View style={styles.subContainer}>
                <View style={styles.textContainer}>
                  {data.level != null && <Text style={styles.subtext}>{'Level ' + data.level} </Text>}
                  {data.attribute != null && <Text style={attributeStyle.attribute}>{data.attribute}</Text>}
                </View>
                <View style={styles.textContainer}>
                  {data.race != null && <Text style={styles.type}>{data.race} </Text>}
                  {data.type != null && <Text style={styles.type}>{data.type}</Text>}
                </View>
                <View style={styles.textContainer}>
                  {data.atk != null && <Text style={styles.subtext}>{'ATK/' + data.atk} </Text>}
                  {data.def != null && <Text style={styles.subtext}>{'DEF/' + data.def}</Text>}
                </View>
                <Text style={styles.description}>{data.desc[0][language]}</Text>
              </View>
            </View>
          </>
          }
        </ScrollView>
      </>}
      </ImageBackground>
  );
};

const styles = StyleSheet.create({
  image: {
    height: '100%',
  },
  errorContainer: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 600,
    backgroundColor: '#000c',
  },
  errorFrame: {
    width: '80%',
    position: 'absolute',
    zIndex: 400,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#24242e',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
      fontSize: 22,
      fontFamily: 'Roboto',
      fontWeight: 700,
      color: '#ffffff',
      marginRight: 4,
  },
  errorText: {
      fontSize: 18,
      fontFamily: 'Roboto',
      fontWeight: 600,
      color: '#fff',
      marginBottom: 24,
  },
  errorDismiss: {
      alignSelf: 'flex-end',
      justifyContent: 'center',
      width: 64,
      height: 32,
  },
  errorOkay: {
      fontSize: 18,
      fontFamily: 'Roboto',
      textAlign: 'center',
      color: '#ffdd00',
  },
  button: {
    width: Math.max(40, deviceWidth * 0.07) * 1.2,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 100,
    borderRadius: 200,
    backgroundColor: '#12121b',
    opacity: 0.75,
    margin: deviceWidth * 0.02,
  },
  container: {
    padding: '5%',
  },
  imgContainer: {
    flexDirection: 'row',
  },
  cardImg: {
    width: '80%',
    maxWidth: 400,
    aspectRatio: 0.686,
    marginRight: '5%',
  },
  showLgButton: {
    width: '90%',
    aspectRatio: 1,
    marginVertical: '20%',
    backgroundColor: '#fffb',
    borderRadius: 500,
    borderColor: '#fff',
    borderWidth: 2,
  },
  lgImg: {
    height: '100%',
    aspectRatio: 1,
    borderRadius: 500,
  },
  lgContainer: {
    width: '100%',
    alignItems: 'center',
  },
  lgButton: {
    width: '90%',
    aspectRatio: 1,
    marginVertical: '20%',
    backgroundColor: '#fffb',
    borderRadius: 500,
    opacity: 0.75,
  },
  name: {
    color: 'white',
    fontFamily: 'Roboto',
    fontSize: Math.max(26, deviceWidth * 0.03),
    fontWeight: 700,
  },
  subContainer: {
    marginTop: '5%',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  subtext: {
    color: 'white',
    fontFamily: 'Roboto',
    fontSize: Math.max(22, deviceWidth * 0.0254),
  },
  type: {
    color: 'white',
    fontFamily: 'Roboto',
    fontSize: Math.max(22, deviceWidth * 0.0254),
  },
  description: {
    color: 'white',
    fontFamily: 'Roboto',
    fontSize: Math.max(20, deviceWidth * 0.0231),
    marginTop: '5%',
  },
});

export default CardInfoScreen;

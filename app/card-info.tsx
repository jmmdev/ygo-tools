import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRef, useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Icon} from '@rneui/themed';
import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { Prompt } from '@/components/Prompt';
import { SafeAreaView } from 'react-native-safe-area-context';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

export default function CardInfo() {
  const LANG_IMAGES = {
    en: require('../assets/images/en.png'),
    fr: require('../assets/images/fr.png'),
    de: require('../assets/images/de.png'),
    it: require('../assets/images/it.png'),
    pt: require('../assets/images/pt.png'),
  };
  const LANGUAGES = [
    {code: 'en', img: LANG_IMAGES.en, name: 'English'},
    {code: 'fr', img: LANG_IMAGES.fr, name: 'Français'},
    {code: 'de', img: LANG_IMAGES.de, name: 'Deutsch'},
    {code: 'it', img: LANG_IMAGES.it, name: 'Italiano'},
    {code: 'pt', img: LANG_IMAGES.pt, name: 'Português'},
  ];

  const params = useLocalSearchParams(); 

  const [language, setLanguage] = useState('en');
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [showMessage, setShowMessage] = useState(false);
  const [showTranslationError, setShowTranslationError] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const errorMessage = useRef('');
  
  const isFocused = useIsFocused();

  const bgImg = require('../assets/images/bg.png');

  const [loaded, error] = useFonts({
    'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
    'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
    'Roboto': require('../assets/fonts/Roboto.ttf'),
  });

  useEffect(() => {
      async function fetchCard(code: string, lg: string) {
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
                    setData({info: cardData});
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

    async function searchByCode(code: string) {
      try {
          const value = await AsyncStorage.getItem(code);

          if (value !== null) {
            setData({info: JSON.parse(value)});
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
        if (typeof params.id === "string") {
            searchByCode(params.id);
        }
    }, [isFocused]);

  async function selectLanguage(lg:string) {
    if (lg !== language) {
      setShowLanguages(false);
      setIsTranslationLoading(true);
      const id = params.id;

      try {
        if (typeof id === "string") {
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
                        setData({info: parsedValue});
                        setLanguage(lg);
                        setIsTranslationLoading(false);
                        });
                    } catch (e) {
                    setIsTranslationLoading(false);
                    }
                    });
                } else {
                    errorMessage.current = 'No translation available';
                    setShowTranslationError(true);
                    setIsTranslationLoading(false);
                }
                })
                .catch((error) => {
                  errorMessage.current = 'Error while retrieving translation information';
                  setShowTranslationError(true);
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
        }
      } catch (e) {
        errorMessage.current = 'There was an error while processing your request, please try again';
        setShowMessage(true);
        setIsTranslationLoading(false);
      }
    }
  }

  const doShowLanguages = () => {
    setShowLanguages(!showLanguages);
  };

  const attributeStyle = data.info
  ? StyleSheet.create({
      attribute: {
        fontFamily: 'Roboto-700',
        fontSize: Math.max(22, deviceWidth * 0.0254),
        color:
              data.info.attribute === 'FIRE' ? 'red' :
              data.info.attribute === 'WATER' ? '#00aacc' :
              data.info.attribute === 'WIND' ? '#00cc66' :
              data.info.attribute === 'EARTH' ? '#886f00' :
              (data.info.attribute === 'LIGHT' || data.info.attribute === 'DIVINE') ? '#ffee00' :
              data.info.attribute === 'DARK' ? '#aa55ff' :
              '#fff',
      },
    })
  : null;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bgImg}  resizeMode="cover" style={[styles.image, showMessage && {alignItems: 'center'} , (isInfoLoading || showMessage) && {justifyContent: 'center'}]}>
        {
        isInfoLoading &&
          <ActivityIndicator size={120} color={'#fffb'}/>
        }
        {
        !isInfoLoading && (showMessage || showTranslationError) &&
          <Prompt description={errorMessage.current} type={'ok'} 
            okAction={() => {
              setShowMessage(false);
              showTranslationError ? setShowTranslationError(false) : router.back() } 
            }
          />
        }
        {
        !isInfoLoading && !showMessage && data.info &&
          <>
          <View style={styles.top}>
            <TouchableOpacity activeOpacity={0.5} style={styles.backButton} onPress={() => router.back()}>
              <Icon color="#fffc" name="arrow-left" size={deviceWidth * 0.06} type="material-community"/>
            </TouchableOpacity>
            <Text style={styles.headerText}>Card details</Text>
          </View>
          <View style={styles.innerContainer}>
            <Image style={styles.cardImg} source={{uri: data.info.card_images[0].image_url}} />
          
            <ScrollView persistentScrollbar={true}>
              {
              isTranslationLoading &&
                <ActivityIndicator style={{height: deviceHeight * 0.94 - deviceWidth * 0.15 - Math.min(deviceWidth * 0.9, 400) / 0.686}} size={100} color={'#ffffffb0'}/>
              }
              {
              !isTranslationLoading && data.info &&
              <View>
                <Text style={styles.name}>{(data.info.name[0][language]).toUpperCase()}</Text>
                <View style={styles.subContainer}>
                  <View style={styles.textContainer}>
                    {data.info.level != null && data.info.level > 0 && <Text style={styles.subtext}>{(data.info.frameType === 'xyz' ? 'Rank ' : 'Level ') + data.info.level} </Text>}
                    {data.info.linkval != null && data.info.linkval > 0 && <Text style={styles.subtext}>{'LINK-' + data.info.linkval} </Text>}
                    {data.info.attribute != null && <Text style={attributeStyle && attributeStyle.attribute}>{data.info.attribute}</Text>}
                  </View>
                  <View style={styles.textContainer}>
                    {data.info.race != null && <Text style={styles.type}>{data.info.race} </Text>}
                    {data.info.type != null && <Text style={styles.type}>{data.info.type}</Text>}
                  </View>
                  <View style={styles.textContainer}>
                    {data.info.atk != null && <Text style={styles.subtext}>{'ATK/' + data.info.atk} </Text>}
                    {data.info.def != null && <Text style={styles.subtext}>{'DEF/' + data.info.def}</Text>}
                  </View>
                  <Text style={styles.description}>{data.info.desc[0][language]}</Text>
                </View>
              </View>
              }
            </ScrollView>
          </View>
          <View style={styles.mainLg}>
            <TouchableOpacity style={styles.lgButton} onPress={() => doShowLanguages()} activeOpacity={0.5}>
              <Image style={[styles.lgImg, {opacity: showLanguages ? 0.5 : 1}]} source={(LANG_IMAGES as any)[language]}/>
            </TouchableOpacity>
          </View>
          {showLanguages &&
          <View style={styles.optionsContainer}>
            <View style={styles.optionsFrame}>
            {LANGUAGES.map((lg, index) => {
              return (
                <TouchableOpacity style={[styles.optionContainer, {
                  backgroundColor: language === lg.code ? "#454658" : "#232436",
                  borderTopLeftRadius: index === 0 ? 16 : 0,
                  borderTopRightRadius: index === 0 ? 16 : 0,
                  borderBottomLeftRadius: index === LANGUAGES.length - 1 ? 16 : 0,
                  borderBottomRightRadius: index === LANGUAGES.length - 1 ? 16 : 0
                }]}
                onPress={() => showLanguages ? selectLanguage(lg.code) : {}} disabled={isTranslationLoading}>
                  <View style={styles.radioButton}>
                      {language === lg.code && <View style={styles.radioThumb} />}
                  </View>
                  <View style={{height: deviceWidth * 0.1, gap: deviceWidth * 0.03, flexDirection: 'row', alignItems: 'center'}}>
                      <View style={styles.lgButton}>
                        <Image style={styles.lgImg} source={lg.img}/>
                      </View>
                      <Text style={styles.optionText}>{lg.name}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            </View>
          </View>
          }
        </>
        }
      </ImageBackground>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#232436',
    minHeight: deviceHeight,
  },
  top: {
    width: '100%',
    height: '6%',
    backgroundColor: '#232436',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: 'Roboto-700',
    fontSize: 24,
    color: '#fff',
},
  image: {
    height: '100%',
  },
  backButton: {
    width: deviceWidth * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    width: '100%',
    height: '94%',
    gap: deviceWidth * 0.05,
    padding: '5%',
  },
  cardImg: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 0.686,
    marginRight: '5%',
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
      backgroundColor: '#454658',
      flexDirection: 'column',
      gap: 1,
      borderRadius: 16,
  },
  optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#232436',
      gap: deviceWidth * 0.05,
      paddingVertical: deviceWidth * 0.05,
      paddingHorizontal: deviceWidth * 0.08,
  },
  radioButton: {
      width: deviceWidth * 0.08,
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
  lgButton: {
    height: '100%',
    aspectRatio: 1,
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lgImg: {
    height: '100%',
    aspectRatio: 1,
    borderRadius: 500,
  },
  optionText: {
      fontFamily: 'Roboto',
      color: '#ffffffc0',
      fontSize: 26,
  },
  mainLg: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: deviceWidth * 0.015,
    width: deviceHeight * 0.06,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: 'white',
    fontFamily: 'Roboto-700',
    fontSize: Math.max(26, deviceWidth * 0.03),
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
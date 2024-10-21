import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRef, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Icon} from '@rneui/themed';
import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Prompt } from '@/components/Prompt';

type Card = {
  info?: any;
}

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
    {code: 'en', img: LANG_IMAGES.en},
    {code: 'fr', img: LANG_IMAGES.fr},
    {code: 'de', img: LANG_IMAGES.de},
    {code: 'it', img: LANG_IMAGES.it},
    {code: 'pt', img: LANG_IMAGES.pt},
  ];

  const params = useLocalSearchParams(); 

  const [language, setLanguage] = useState('en');
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [data, setData] = useState({} as Card);
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
    <View style={styles.container}>
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
          <TouchableOpacity activeOpacity={0.5} style={styles.backButton} onPress={() => router.back()}>
            <Icon color="#fff" name="arrow-back" size={Math.max(40, deviceWidth * 0.07)} type="material"/>
          </TouchableOpacity>
          <View style={styles.innerContainer}>
            <View style={styles.imgContainer}>
              <Image style={styles.cardImg} source={{uri: data.info.card_images[0].image_url}} />
              <View style={{width: Math.min(deviceWidth * 0.15, 64), justifyContent: 'center', alignItems: 'center'}}>
                <TouchableOpacity style={styles.showLgButton} onPress={() => doShowLanguages()} activeOpacity={0.5}>
                  <Image style={styles.lgImg} source={(LANG_IMAGES as any)[language]}/>
                </TouchableOpacity>
                {displayLanguageList()}
              </View>
            </View>
          </View>
          <ScrollView persistentScrollbar={true} contentContainerStyle={{paddingHorizontal: '5%', paddingBottom: '5%'}}>
            {
            isTranslationLoading &&
              <ActivityIndicator style={{height: 250}} size={100} color={'#ffffffb0'}/>
            }
            {
            !isTranslationLoading && data.info &&
              <>
              <View>
                <Text style={styles.name}>{(data.info.name[0][language]).toUpperCase()}</Text>
                <View style={styles.subContainer}>
                  <View style={styles.textContainer}>
                    {data.info.level != null && data.info.level > 0 && <Text style={styles.subtext}>{data.info.frameType == 'xyz' ? 'Rank ' : 'Level ' + data.info.level} </Text>}
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
            </>
            }
          </ScrollView>
        </>
        }
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: deviceHeight,
  },
  image: {
    height: '100%',
  },
  backButton: {
    width: Math.max(40, deviceWidth * 0.07) * 1.2,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 100,
    borderRadius: 200,
    backgroundColor: '#12121b',
    opacity: 0.75,
    marginLeft: deviceWidth * 0.02,
    marginTop: deviceWidth * 0.1,
  },
  innerContainer: {
    padding: '5%',
    marginTop: '20%',
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
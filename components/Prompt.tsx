import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@rneui/themed';
import { useFonts } from 'expo-font';

const deviceWidth = Dimensions.get('window').width;

export function Prompt({description, type, yesAction, noAction, okAction}:{description: string, type: string, yesAction?: any, noAction?: any, okAction?:any}) {
    const [loaded, error] = useFonts({
        'Roboto-700': require('../assets/fonts/Roboto-700.ttf'),
        'Roboto-600': require('../assets/fonts/Roboto-600.ttf'),
        'Roboto': require('../assets/fonts/Roboto.ttf'),
    });

    return (
        <View style={styles.container}>
            <View style={styles.frame}>
                <View style={styles.upperContent}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>YGO Tools</Text>
                        <Icon color="#ffffffc0" name="warning" size={22} type="material" style={{marginLeft: 4}}/>
                    </View>
                    <Text style={styles.description}>{description}</Text>
                </View>
                
                <View style={[styles.buttonsContainer, {justifyContent: type === "ok" ? "center" : "space-between"}]}>
                {type === "yesno" &&
                <>
                    <TouchableOpacity style={[styles.button, styles.noButton]} onPress={noAction}>
                        <Text style={[styles.buttonText, styles.noText]}>No</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.yesButton]} onPress={yesAction}>
                        <Text style={[styles.buttonText, styles.yesText]}>Yes</Text>
                    </TouchableOpacity>
                </>
                }
                {
                type === "ok" &&
                <TouchableOpacity style={[styles.button, styles.noButton]} onPress={okAction}>
                    <Text style={[styles.buttonText, styles.noText]}>OK</Text>
                </TouchableOpacity>
                }
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000c',
        zIndex: 600,
    },
    frame: {
        width: '80%',
        backgroundColor: '#24242e',
    },
    upperContent: {
        padding: '5%',
        paddingBottom: 0,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '5%',
    },
    title: {
        fontSize: 22,
        fontFamily: 'Roboto-700',
        color: '#fffc',
    },
    description: {
        width: '85%',
        textAlign: 'justify',
        alignSelf: 'center',
        fontSize: 18,
        fontFamily: 'Roboto-600',
        color: '#fff',
        marginBottom: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#0014',
        padding: '5%',
    },
    button: {
        justifyContent: 'center',
        padding: '4%',
        width: '45%',
        borderRadius: deviceWidth * 0.02,
    },
    noButton: {
        borderWidth: deviceWidth * 0.002,
        borderColor: '#fff',
    },
    yesButton: {
        backgroundColor: '#0af',
    },
    buttonText: {
        fontSize: 20,
        fontFamily: 'Roboto-700',
        textAlign: 'center',
    },
    noText: {
        color: '#fff',
    },
    yesText: {
        color: '#000',
    }
})
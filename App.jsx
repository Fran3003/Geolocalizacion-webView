import React, {useRef} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';

export default function App() {
  const webViewRef = useRef(null);

  const getGeoLocationJS = () => {
    const getCurrentPosition = `
    navigator.geolocation.getCurrentPosition = (success, error, options) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'getCurrentPosition', options: options }));

      window.addEventListener('message', (e) => {
        let eventData = {}
        try {
          eventData = JSON.parse(e.data);
        } catch (e) {}

        if (eventData.event === 'currentPosition') {
          success(eventData.data);
        } else if (eventData.event === 'currentPositionError') {
          error(eventData.data);
        }
      });
    };
    true;
    console.log('getCurrentPosition function injected');
    `;

    const watchPosition = `
    navigator.geolocation.watchPosition = (success, error, options) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'watchPosition', options: options }));

      window.addEventListener('message', (e) => {
        let eventData = {}
        try {
          eventData = JSON.parse(e.data);
        } catch (e) {}

        if (eventData.event === 'watchPosition') {
          success(eventData.data);
        } else if (eventData.event === 'watchPositionError') {
          error(eventData.data);
        }
      });
    };
    true;
    console.log('watchPosition function injected');
    `;

    const clearWatch = `
    navigator.geolocation.clearWatch = (watchID) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'clearWatch', watchID: watchID }));
    };
    true;
    console.log('clearWatch function injected');
    `;

    const injectButton = `
    function injectButton() {
      console.log('Button injected');
      var button = document.createElement('button');
      button.innerHTML = 'Show Current Location';
      button.onclick = function() {
        console.log('Button clicked');
        navigator.geolocation.getCurrentPosition(
          function(position) {
            console.log('getCurrentPosition success');
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'showCurrentLocation', data: position.coords }));
          },
          function(error) {
            console.log('getCurrentPosition error', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'showCurrentLocationError', data: error.message }));
          }
        );
      };

      document.body.appendChild(button);
    }

    window.onload = function() {
      console.log('Window loaded');
      injectButton();
    };
    console.log('injectButton function injected');
  `;

    return `
      (function() {
        ${getCurrentPosition}
        ${watchPosition}
        ${clearWatch}
        ${injectButton}
      })();
    `;
  };

  const onMessage = event => {
    let data = {};
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      console.log('Error parsing JSON data:', e);
    }
    console.log('Received message:', data);

    if (data?.event) {
      if (data.event === 'getCurrentPosition') {
        console.log('Handling getCurrentPosition event');
        Geolocation.getCurrentPosition(
          position => {
            console.log('getCurrentPosition success', position);
            const locationMessage = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
            // Muestra la información de ubicación en una alerta dentro de la WebView
            window.alert(locationMessage);
          },
          error => {
            console.log('getCurrentPosition error', error);
            webViewRef.current.postMessage(
              JSON.stringify({event: 'currentPositionError', data: error}),
            );
          },
          data.options,
        );
      } else if (data.event === 'watchPosition') {
        console.log('Handling watchPosition event');
        Geolocation.watchPosition(
          position => {
            console.log('watchPosition success', position);
            webViewRef.current.postMessage(
              JSON.stringify({event: 'watchPosition', data: position}),
            );
          },
          error => {
            console.log('watchPosition error', error);
            webViewRef.current.postMessage(
              JSON.stringify({event: 'watchPositionError', data: error}),
            );
          },
          data.options,
        );
      } else if (data.event === 'clearWatch') {
        console.log('Handling clearWatch event');
        Geolocation.clearWatch(data.watchID);
      } else if (data.event === 'showCurrentLocation') {
        console.log('Handling showCurrentLocation event', data.data);
        alert('Current Location: ' + JSON.stringify(data.data));
      } else if (data.event === 'showCurrentLocationError') {
        console.log('Handling showCurrentLocationError event', data.data);
        alert('Error getting current location: ' + data.data);
      }
    }
  };

  return (
    <View style={{flex: 1}}>
      <WebView
        ref={webViewRef}
        javaScriptEnabled={true}
        injectedJavaScript={getGeoLocationJS()}
        onMessage={onMessage}
        source={{
          uri: 'https://power-app-engine.vercel.app/flake/bIt5ItBs9IIuBtzziqyJ.4vqLSttZiqGhrNRea8s5',
        }}
        startInLoadingState={true}
      />
    </View>
  );
}

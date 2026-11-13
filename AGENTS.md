# Frontend Motorista — Diretrizes para Agentes

## Stack
- React Native 0.88, Expo 58 (execução via **Expo Go** com a flag `--go`)
- Navegação: `expo-router`
- Estilização: `nativewind` / `tailwindcss`
- Mapa e Radar: `react-native-maps`, `expo-location`, componentes de despacho e aceite de corridas
- Tempo Real: `laravel-echo` + `pusher-js` conectado ao Laravel Reverb

## Execução e Conectividade
- IP LAN de desenvolvimento: `10.199.53.233`
- Backend API: `http://10.199.53.233/api` (se Sail porta 80) ou `http://10.199.53.233:8000/api` (se artisan serve).
- Reverb WebSocket: `10.199.53.233:8080`
- Inicialização para dispositivo físico na rede:
  ```bash
  REACT_NATIVE_PACKAGER_HOSTNAME=10.199.53.233 npm run start:go
  ```
- Portas Metro: gestão `8081`, passageiro `8082` e motorista `8083` (este app); `start:go` já usa a 8083
- Testes rodam em Expo Go; builds EAS apenas para distribuição

## Validação
- Linter: `npm run lint`
- Formatação: `npm run format:check`

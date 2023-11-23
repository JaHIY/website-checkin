# Website Checkin

Copy an example configuration file and rename it as `config.yaml`.
```
$ cp ./config.example.yaml ./config.yaml
```
Please set the urls, usernames, and passwords in the `config.yaml`.

Run the following command to install the dependencies.
```
$ pnpm install
```

Run the project.
```
$ pnpm start -c ./config.yaml
```

The possible outputs are as follows.
```
> website-checkin@1.0.0 start /srv
> ts-node ./src/index.ts "-c" "./config.yaml"

2023-11-23 06:03:39.898 | info  | Read config from ./config.yaml
2023-11-23 06:05:15.010 | info  | Setup web driver
2023-11-23 06:05:15.019 | info  | Waiting for page 'https://example1.com/auth/login'
2023-11-23 06:05:15.079 | info  | Setup web driver
2023-11-23 06:05:15.082 | info  | Waiting for page 'https://example2.com/auth/login'
2023-11-23 06:05:17.929 | info  | Get page title: Login - Example 1
2023-11-23 06:05:17.968 | info  | Find usernameElement
2023-11-23 06:05:18.202 | info  | Clear usernameElement
2023-11-23 06:05:18.738 | info  | Fill usernameElement
2023-11-23 06:05:18.772 | info  | Find passwordElement
2023-11-23 06:05:18.853 | info  | Clear passwordElement
2023-11-23 06:05:19.016 | info  | Get page title: Login — Example 2
2023-11-23 06:05:19.078 | info  | Find usernameElement
2023-11-23 06:05:19.095 | info  | Fill passwordElement
2023-11-23 06:05:19.154 | info  | Find submitElement
2023-11-23 06:05:19.217 | info  | Clear usernameElement
2023-11-23 06:05:19.266 | info  | Click submitElement
2023-11-23 06:05:19.491 | info  | Fill usernameElement
2023-11-23 06:05:19.509 | info  | Find passwordElement
2023-11-23 06:05:19.617 | info  | Clear passwordElement
2023-11-23 06:05:19.711 | info  | Fill passwordElement
2023-11-23 06:05:19.726 | info  | Find submitElement
2023-11-23 06:05:19.791 | info  | Click submitElement
2023-11-23 06:05:43.621 | info  | Login successfully
2023-11-23 06:05:44.551 | info  | Get checkinPage title: User Center — Example 1
2023-11-23 06:05:44.585 | info  | Checkin
2023-11-23 06:05:47.843 | info  | Login successfully
2023-11-23 06:05:47.985 | info  | Checkin Completed
2023-11-23 06:05:48.703 | info  | Get checkinPage title: User Center — Example 2
2023-11-23 06:05:48.723 | info  | Checkin
2023-11-23 06:05:49.343 | info  | Checkin Completed
```

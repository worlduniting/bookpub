import chalk from 'chalk';
import cliui from 'cliui';
import fs from 'fs';
import path from 'path';


export default async function runWebpackDevServerAsync(outputType) {
    // Find the absolute path to the webpack-cli binary inside the bookpub package
    const bookpubNodeModules = path.join(__dirname, 'node_modules');
    const webpackCliPath = path.join(bookpubNodeModules, 'webpack-cli', 'bin', 'cli.js');

    // Check if the user's webpack.config.js file exists
    const userWebpackConfigPath = path.join(process.cwd(), 'webpack.config.js');
    const defaultWebpackConfig = path.join(__dirname, 'example-book/webpack.config.js');
    const configFlag = fs.existsSync(userWebpackConfigPath) ? ['--config', userWebpackConfigPath] : ['--config', defaultWebpackConfig];

    try {
        const server = spawn(
            'node',
            [webpackCliPath, 'serve', '--env', `outputType=${outputType}`, ...configFlag],
            { stdio: 'inherit' }
        );

        server.on('error', (error) => {
            const uiSrv = cliui({ wrap: false });
            uiSrv.div({
                text: chalk.yellowBright(`We couldn\'t start our Webpack Server for \"Dev Mode\' because: ${error}`),
                padding: [5, 0, 0, 5]
            });
            uiSrv.div({
                text: chalk.yellowBright(`If you are using your own settings, please make sure you have \'webpack.config.js\' properly configured, and in the root/top-level direcctory of your project.`),
                padding: [5, 0, 0, 5]
            });
            console.error(uiSrv.toString());
        });
    } catch (error) {
        console.error("We couldn\'t get Webpack started in Dev Mode")
    };

    runServer();
}
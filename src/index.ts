import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { deployAppIcon } from './icons';
import { Widget } from '@lumino/widgets';
namespace CommandIDs {
  /**
   * Opens the URL to deploy the application with pre-populated fields
   */
  export const deployApp = 'jhub-apps:deploy-app';
}

interface IDeployAppArgs {
  /**
   * The origin of the command e.g. main-menu, context-menu, etc.
   */
  origin?: string;
  /**
   * Whether or not the deployment form should be opened in headless mode
   */
  headless?: boolean;
}

interface IPathWidget {
  /**
   * The context object associated with the widget.
   * Contains the metadata and information about the widget.
   */
  context: {
    /**
     * The path of the current document or resource associated with the widget.
     * Typically represents the file path or location of the notebook or document.
     */
    path: string;
  };
}

const hasContextPath = (widget: any): widget is IPathWidget => {
  return widget && widget.context && typeof widget.context.path === 'string';
};

const jhubAppsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-jhub-apps:commands',
  description: 'Adds additional commands used by jhub-apps.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const deploymentFormUrl = '/services/japps/create-app';

    const openInIFrame = (deployUrl: string) => {
      try {
        const iframe = document.createElement('iframe');
        iframe.src = deployUrl;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.style.border = 'none';

        const widget = new deployAppWidget();
        widget.node.appendChild(iframe);

        app.shell.add(widget, 'main');
      } catch (error) {
        console.warn(`Error opening ${deployUrl} in iframe: ${error}`);
      }
    };

    const openInWindow = (url: string) => {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.warn(`Error opening ${url}: ${error}`);
      }
    };

    const calculateIcon = (args: IDeployAppArgs) => {
      switch (args.origin) {
        case 'main-menu':
          return undefined;
        case 'context-menu':
        case 'toolbar':
        case undefined:
        default:
          return deployAppIcon;
      }
    };

    app.commands.addCommand(CommandIDs.deployApp, {
      execute: (args: IDeployAppArgs) => {
        const currentWidget = app.shell.currentWidget;
        const currentPath = hasContextPath(currentWidget)
          ? currentWidget.context.path
          : '';

        let queryParameters: string;
        if (currentPath !== '') {
          queryParameters = `?filepath=${encodeURIComponent(currentPath)}`;
        } else {
          queryParameters = '?';
        }

        if (args.headless) {
          if (queryParameters !== '?') {
            queryParameters += '&headless=true';
          } else {
            queryParameters += 'headless=true';
          }
          openInIFrame(`${deploymentFormUrl}${queryParameters}`);
        } else {
          openInWindow(`${deploymentFormUrl}${queryParameters}`);
        }
      },
      label: 'Deploy App',
      icon: calculateIcon
    });
  }
};

const plugins = [jhubAppsPlugin];

export default plugins;

class deployAppWidget extends Widget {
  constructor() {
    super();
    this.addClass('jp-example-view');
    this.id = 'deploy-app';
    this.title.label = 'Deploy App';
    this.title.closable = true;
  }
}

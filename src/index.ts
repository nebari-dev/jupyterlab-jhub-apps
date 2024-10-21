import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { deployAppIcon } from './icons';
import { WidgetTracker, IFrame, MainAreaWidget } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

const DEFAULT_BASE_URL = '/services/japps/create-app';
namespace CommandIDs {
  /**
   * Opens the URL for deploying an app with pre-populated fields.
   */
  export const deployApp = 'jhub-apps:deploy-app';
}

interface IDeployAppArgs {
  /**
   * The origin of the command e.g. main-menu, context-menu, etc.,
   * which determines the icon and label to display.
   */
  origin?: string;
  /**
   * The base URL of the app deployment form.
   */
  baseUrl?: string;
  /**
   * Additional query parameters to be appended to the baseUrl.
   */
  queryParameters?: {
    headless?: string;
    filepath?: string;
  };
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

function coerceBooleanString(value: any): 'true' | 'false' {
  if (value === undefined) {
    return 'true';
  }

  if (
    typeof value === 'string' &&
    ['true', 'false'].includes(value.toLowerCase())
  ) {
    return value.toLowerCase() as 'true' | 'false';
  }

  console.warn(`Invalid value: ${value}. Defaulting to 'true'.`);
  return 'true';
}

export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

const jhubAppsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-jhub-apps:commands',
  description: 'Adds additional commands used by jhub-apps.',
  autoStart: true,
  optional: [ILayoutRestorer],
  activate: (app: JupyterFrontEnd, restorer: ILayoutRestorer | null) => {
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
      execute: ({
        origin,
        baseUrl = DEFAULT_BASE_URL,
        queryParameters = {}
      }: IDeployAppArgs) => {
        const currentWidget = app.shell.currentWidget;
        const filepath = hasContextPath(currentWidget)
          ? currentWidget.context.path
          : '';

        const selectedFilepath =
          queryParameters.filepath !== undefined
            ? queryParameters.filepath
            : filepath;

        const headless = coerceBooleanString(queryParameters.headless);

        const updatedQueryParameters = {
          ...queryParameters,
          headless: headless,
          filepath: selectedFilepath
        };

        let mainAreaWidget: MainAreaWidget<DeployAppWidget> | undefined;
        if (headless === 'true') {
          try {
            if (!mainAreaWidget || mainAreaWidget.isDisposed) {
              const content = new DeployAppWidget({
                origin: origin,
                baseUrl: baseUrl,
                queryParameters: updatedQueryParameters
              });
              mainAreaWidget = new MainAreaWidget({ content });
            }

            if (!tracker.has(mainAreaWidget)) {
              tracker.add(mainAreaWidget);
            }

            // non-empty origin implies user has called command e.g. main-menu click.
            // guards against (what appears to be) command execution from tracker
            // on session restore.
            if (origin) {
              if (!mainAreaWidget.isAttached) {
                app.shell.add(mainAreaWidget, 'main');
              }
            }
          } catch (error) {
            console.warn(`Error opening in headless mode: ${error}`);
          }
        } else {
          try {
            // no restore logic required here as opening in a separate window
            const completeUrl = `${baseUrl}?${buildQueryString(updatedQueryParameters)}`;
            window.open(completeUrl, '_blank', 'noopener,noreferrer');
          } catch (error) {
            console.warn(`Error opening in window: ${error}`);
          }
        }
      },
      label: 'Deploy App',
      icon: calculateIcon
    });

    const tracker = new WidgetTracker<MainAreaWidget<DeployAppWidget>>({
      namespace: 'jhub-apps'
    });

    if (restorer) {
      restorer.restore(tracker, {
        command: CommandIDs.deployApp,
        args: widget => ({
          baseUrl: widget.content.getBaseUrl(),
          queryParameters: widget.content.getQueryParameters()
        }),
        name: widget => widget.content.getCompleteUrl()
      });
    }
  }
};

const plugins = [jhubAppsPlugin];

export default plugins;

class DeployAppWidget extends Widget {
  private _iframe: IFrame;
  private _baseUrl: string;
  private _queryParameters: Record<string, string>;

  constructor({
    queryParameters = {},
    baseUrl = DEFAULT_BASE_URL
  }: IDeployAppArgs) {
    super();
    this._queryParameters = queryParameters;
    this._baseUrl = baseUrl;

    this.addClass('jp-deploy-app-widget');
    this.id = 'deploy-app-jupyterlab';
    this.title.label = 'Deploy App';
    this.title.closable = true;

    this._iframe = new IFrame();
    this._iframe.sandbox = ['allow-scripts', 'allow-same-origin'];
    this._iframe.url = this.getCompleteUrl();
    this.node.appendChild(this._iframe.node);
  }

  getQueryParameters(): Record<string, string> {
    return this._queryParameters;
  }

  getBaseUrl(): string {
    return this._baseUrl;
  }

  getCompleteUrl(): string {
    return `${this._baseUrl}?${buildQueryString(this._queryParameters)}`;
  }
}

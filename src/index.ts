import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { deployAppIcon } from './icons';
import { WidgetTracker, IFrame, MainAreaWidget } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

const DEFAULT_BASE_URL = '/services/japps/create-app';

const PLUGIN_ID = 'jupyterlab-jhub-apps:commands';

/**
 * Settings for the runtime configuration of the application.
 * These are read from the settings registry and updated any
 * time a user changes their settings.
 */
const runtimeSettings = {
  queryParameters: {} as {
    headless?: string;
    filepath?: string;
  },
  baseUrl: DEFAULT_BASE_URL
};

namespace CommandIDs {
  /**
   * Opens the URL for deploying an app with pre-populated fields.
   */
  export const deployApp = 'jhub-apps:deploy-app';
}

interface IDeployAppBaseConfig {
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

interface IDeployAppConfig extends IDeployAppBaseConfig {
  /**
   * The origin of the command e.g. main-menu, context-menu, etc.,
   * which determines the icon and label to display.
   */
  origin?: string;
  IShell?: JupyterFrontEnd.IShell;
  widgetTracker?: WidgetTracker<MainAreaWidget<DeployAppWidget>>;
}

interface IDeployAppWidgetArgs extends IDeployAppBaseConfig {}

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

function applySettings(setting: ISettingRegistry.ISettings): void {
  runtimeSettings.queryParameters = setting.get('queryParameters')
    .composite as Record<string, string>;
  runtimeSettings.baseUrl = setting.get('baseUrl').composite as string;
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

function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

const calculateIcon = (args: IDeployAppConfig) => {
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

const openAppForm = ({
  origin,
  baseUrl,
  IShell,
  widgetTracker,
  queryParameters = {}
}: IDeployAppConfig): void => {
  if (!IShell || !widgetTracker) {
    console.warn(
      'IShell and widgetTracker not defined. These are required to open the deploy app form.'
    );
    return;
  }

  const currentWidget = IShell.currentWidget;

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
          baseUrl: baseUrl,
          queryParameters: updatedQueryParameters
        });
        mainAreaWidget = new MainAreaWidget({ content });
      }

      if (!widgetTracker.has(mainAreaWidget)) {
        widgetTracker.add(mainAreaWidget);
      }

      // non-empty origin implies user has called command e.g. main-menu click.
      // guards against (what appears to be) command execution from tracker
      // on session restore.
      if (origin && !mainAreaWidget.isAttached) {
        IShell.add(mainAreaWidget, 'main');
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
};

const jhubAppsPlugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Adds additional commands used by jhub-apps.',
  autoStart: true,
  requires: [ISettingRegistry],
  optional: [ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    settingsRegistry: ISettingRegistry,
    restorer: ILayoutRestorer | null
  ) => {
    const { commands, shell } = app;

    try {
      const baseSettings = await settingsRegistry.load(PLUGIN_ID);
      applySettings(baseSettings);
      baseSettings.changed.connect(applySettings);
    } catch (error) {
      console.warn(`Failed to load settings for ${PLUGIN_ID}:`, error);
      return;
    }

    const tracker = new WidgetTracker<MainAreaWidget<DeployAppWidget>>({
      namespace: 'jhub-apps'
    });

    commands.addCommand(CommandIDs.deployApp, {
      label: 'Deploy App',
      icon: calculateIcon,
      execute: ({
        origin = undefined,
        queryParameters = runtimeSettings.queryParameters,
        baseUrl = runtimeSettings.baseUrl,
        IShell = shell,
        widgetTracker = tracker
      }: IDeployAppConfig) => {
        openAppForm({
          origin,
          queryParameters,
          baseUrl,
          IShell,
          widgetTracker
        });
      }
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
    baseUrl = DEFAULT_BASE_URL,
    queryParameters = {}
  }: IDeployAppWidgetArgs) {
    super();
    this._baseUrl = baseUrl;
    this._queryParameters = queryParameters;

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

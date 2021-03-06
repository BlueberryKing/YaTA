import { Button, Classes, Colors, FormGroup, InputGroup, Intent, Menu } from '@blueprintjs/core'
import { ItemRenderer, MultiSelect, Suggest } from '@blueprintjs/select'
import * as _ from 'lodash'
import * as pluralize from 'pluralize'
import * as React from 'react'

import BroadcasterSection from 'Components/BroadcasterSection'
import ExternalLink from 'Components/ExternalLink'
import NonIdealState from 'Components/NonIdealState'
import Spinner from 'Components/Spinner'
import { BroadcasterSectionProps } from 'Containers/BroadcasterOverlay'
import Twitch, { RawCommunity, RawGame, RawNotification } from 'Libs/Twitch'
import styled, { theme } from 'Styled'

/**
 * Game suggest component.
 */
const GameSuggest = Suggest.ofType<RawGame>()

/**
 * Communities select component.
 */
const CommunitiesMultiSelect = MultiSelect.ofType<RawCommunity>()

/**
 * InfoInput component.
 */
const InfoInput = styled(InputGroup)`
  .${Classes.DARK} & > .${Classes.INPUT}.${Classes.DISABLED}, .${Classes.DARK} & > .${Classes.INPUT}:disabled {
    ${theme('broadcaster.input.disabled')};
  }
`

/**
 * GameFormGroup component.
 */
const GameFormGroup = styled(FormGroup)`
  width: 100%;
`

/**
 * GameInput component.
 */
const GameInput = styled(GameSuggest)`
  width: 100%;

  & > span {
    width: 100%;
  }

  & .${Classes.INPUT} {
    &::placeholder {
      color: ${Colors.DARK_GRAY1};
    }
  }

  .${Classes.DARK} & .${Classes.INPUT} {
    &.${Classes.DISABLED}, &:disabled {
      ${theme('broadcaster.input.disabled')};
    }

    &::placeholder {
      color: ${Colors.LIGHT_GRAY5};
    }
  }
`

/**
 * GameMenuItem component.
 */
const GameMenuItem = styled(Menu.Item)`
  &.${Classes.MENU_ITEM} {
    align-items: center;
  }

  & .${Classes.MENU_ITEM_LABEL} {
    & > img {
      max-height: 50px;
    }
  }
`

/**
 * CommunitiesInput component.
 */
const CommunitiesInput = styled(CommunitiesMultiSelect)`
  width: 100%;

  & > span {
    width: 100%;
  }

  & .${Classes.INPUT_GHOST} .${Classes.INPUT_GHOST}::placeholder {
    color: ${Colors.DARK_GRAY1};
  }

  .${Classes.DARK} & .${Classes.INPUT} {
    &.${Classes.DISABLED}, &:disabled {
      ${theme('broadcaster.input.disabled')};
    }

    & .${Classes.INPUT_GHOST}::placeholder {
      color: ${Colors.LIGHT_GRAY5};
    }
  }
`

/**
 * UpdateButton component.
 */
const UpdateButton = styled(Button)`
  margin-top: 5px;
`

/**
 * Various controlled inputs.
 */
enum Input {
  Communities = 'communities',
  Game = 'game',
  Notification = 'notification',
  Title = 'title',
}

/**
 * Various input max lengths.
 */
const InputMaxLengths = {
  [Input.Notification]: 140,
  [Input.Title]: 140,
}

/**
 * React State.
 */
const initialState = {
  didFail: false,
  games: null as RawGame[] | null,
  isModified: false,
  isReady: false,
  isUpdating: false,
  liveNotification: undefined as Optional<RawNotification>,
  [Input.Communities]: [] as RawCommunity[],
  [Input.Game]: '',
  [Input.Notification]: '',
  [Input.Title]: '',
}
type State = Readonly<typeof initialState>

/**
 * BroadcasterInformations Component.
 */
export default class BroadcasterInformations extends React.Component<BroadcasterSectionProps, State> {
  public state: State = initialState
  private lastGameQuery = ''
  private lastGameSearchController: AbortController | null = null

  /**
   * Lifecycle: componentDidMount.
   */
  public async componentDidMount() {
    try {
      const { channel, channelId } = this.props

      const response = await Promise.all([
        Twitch.fetchChannelLiveNotification(channelId),
        Twitch.fetchCommunities(channelId),
      ])

      const [liveNotification, { communities }] = response

      this.setState(() => ({
        didFail: false,
        isReady: true,
        liveNotification,
        [Input.Communities]: communities || [],
        [Input.Game]: channel.game || '',
        [Input.Notification]: liveNotification.message || '',
        [Input.Title]: channel.status || '',
      }))
    } catch (error) {
      this.setState(() => ({ didFail: true, isReady: true }))
    }
  }

  /**
   * Renders the component.
   * @return Element to render.
   */
  public render() {
    const {
      didFail,
      games,
      isModified,
      isUpdating,
      isReady,
      [Input.Communities]: communities,
      [Input.Game]: game,
      [Input.Notification]: notification,
      [Input.Title]: title,
    } = this.state
    const { channel } = this.props

    if (didFail) {
      return <NonIdealState retry />
    }

    return (
      <BroadcasterSection title="Stream Informations" ready={isReady}>
        <FormGroup label="Title" labelFor="title" labelInfo={this.getInputLabelInfo(Input.Title)} disabled={isUpdating}>
          <InfoInput
            onChange={this.onChangeTitle}
            placeholder="Enter a title…"
            disabled={isUpdating}
            value={title}
            id="title"
          />
        </FormGroup>
        <GameFormGroup label="Game / Category" labelFor="game" disabled={isUpdating}>
          <GameInput
            initialContent={<Menu.Item disabled text="Search for a new game or category…" />}
            // Note: we use the placeholder to display the previous value until the initial value can be defined.
            // @see https://github.com/palantir/blueprint/issues/2784
            inputProps={{ id: 'game', placeholder: game, disabled: isUpdating }}
            inputValueRenderer={this.gameValueRenderer}
            onItemSelect={this.onSelectGame}
            onQueryChange={this.onChangeGameQuery}
            itemRenderer={this.gameRenderer}
            popoverProps={{ minimal: true }}
            items={games || []}
            resetOnSelect
            openOnKeyDown
            noResults={
              _.isNil(games) ? (
                <Menu.Item disabled text="No results." />
              ) : (
                <Menu.Item disabled text={<Spinner small />} />
              )
            }
          />
        </GameFormGroup>
        <FormGroup label="Communities" labelFor="communities" disabled helperText={this.renderHelperDashoardLink()}>
          <CommunitiesInput
            initialContent={<Menu.Item disabled text="Search for a community…" />}
            tagInputProps={{ disabled: true, placeholder: 'No communities yet.' }}
            noResults={<Menu.Item disabled text="No results." />}
            tagRenderer={this.communityTagRenderer}
            itemRenderer={this.communityRenderer}
            popoverProps={{ minimal: true }}
            selectedItems={communities}
            onItemSelect={_.noop}
            openOnKeyDown
            resetOnSelect
            items={[]}
          />
        </FormGroup>
        <FormGroup
          labelInfo={this.getInputLabelInfo(Input.Notification)}
          helperText={this.renderHelperDashoardLink()}
          label="Live Notification"
          labelFor="notification"
          disabled
        >
          <InfoInput placeholder={`${channel.name} went live!`} value={notification} id="notification" disabled />
        </FormGroup>
        <UpdateButton
          onClick={this.onClickUpdate}
          text="Update informations"
          intent={Intent.PRIMARY}
          disabled={!isModified}
          loading={isUpdating}
          icon="floppy-disk"
        />
      </BroadcasterSection>
    )
  }

  /**
   * Renders the helper link to the Twitch dashboard.
   * @return Element to render.
   */
  private renderHelperDashoardLink() {
    return (
      <>
        This can only be updated on your{' '}
        <ExternalLink href="https://www.twitch.tv/dashboard">Twitch Dasboard</ExternalLink>.
      </>
    )
  }

  /**
   * Render a game suggestion input value.
   * @return Value to render.
   */
  private gameValueRenderer = (game: RawGame) => {
    return game.name
  }

  /**
   * Render a community suggestion tag.
   * @return Value to render.
   */
  private communityTagRenderer = (community: RawCommunity) => {
    return community.display_name
  }

  /**
   * Renders a community suggestion.
   * @return Element to render.
   */
  private communityRenderer: ItemRenderer<RawCommunity> = (community, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null
    }

    return (
      <GameMenuItem
        disabled={modifiers.disabled}
        active={modifiers.active}
        onClick={handleClick}
        text={community.display_name}
        key={community._id}
      />
    )
  }

  /**
   * Renders a game suggestion.
   * @return Element to render.
   */
  private gameRenderer: ItemRenderer<RawGame> = (game, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null
    }

    return (
      <GameMenuItem
        labelElement={<img src={game.box.small} />}
        disabled={modifiers.disabled}
        active={modifiers.active}
        onClick={handleClick}
        text={game.name}
        key={game._id}
      />
    )
  }

  /**
   * Triggered when the game query is modified.
   * @param query - The new query.
   */
  private onChangeGameQuery = async (query: string) => {
    if (query === this.lastGameQuery) {
      return
    }

    this.lastGameQuery = query

    this.setState(() => ({ games: [] }))

    if (query.length > 0) {
      try {
        if (!_.isNil(this.lastGameSearchController)) {
          this.lastGameSearchController.abort()
          this.lastGameSearchController = null
        }

        this.lastGameSearchController = new AbortController()

        const { games } = await Twitch.searchGames(query, this.lastGameSearchController.signal)

        this.lastGameSearchController = null

        this.setState(() => ({ games }))
      } catch (error) {
        //
      }
    }
  }

  /**
   * Triggered when a game is selected.
   * @param game - The selected game.
   */
  private onSelectGame = (game: RawGame) => {
    this.setState(({ title }) => this.getModificationsState(title, game.name))
  }

  /**
   * Triggered when the update button is clicked.
   */
  private onClickUpdate = async () => {
    const { channelId } = this.props
    const { game, title } = this.state

    if (_.isNil(channelId) || _.isNil(title) || _.isNil(game)) {
      return
    }

    try {
      this.setState(() => ({ isUpdating: true }))

      const channel = await Twitch.updateChannel(channelId, title, game)

      this.setState(() => ({
        isModified: false,
        isUpdating: false,
        [Input.Game]: channel.game || '',
        [Input.Title]: channel.status || '',
      }))
    } catch (error) {
      this.setState(() => ({ didFail: true, isUpdating: false }))
    }
  }

  /**
   * Triggered when the title is modified.
   * @param event - The associated event.
   */
  private onChangeTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.currentTarget.value

    this.setState(({ game }) => this.getModificationsState(title, game))
  }

  /**
   * Returns the label info for a specific input.
   */
  private getInputLabelInfo(input: Input) {
    const value = this.state[input] || ''
    const characters = InputMaxLengths[input] - value.length

    return `(${characters} ${pluralize('character', characters)} remaining)`
  }

  /**
   * Returns the state after modifying values.
   * @param  title - The stream title.
   * @param  game - The stream game.
   * @return The modified state.
   */
  private getModificationsState(title: string, game: string) {
    const sanitizedTitle = title.substring(0, InputMaxLengths[Input.Title])

    const { channel } = this.props
    const isModified = (!_.isNil(channel) && channel.status !== title) || (!_.isNil(channel) && channel.game !== game)

    return { isModified, [Input.Game]: game, [Input.Title]: sanitizedTitle }
  }
}

import { Button, Classes, IButtonProps, Position, Tooltip } from '@blueprintjs/core'
import * as _ from 'lodash'
import * as React from 'react'

import { ChannelDetailsPanel, ChannelDetailsType } from 'Components/ChannelDetailsOverview'
import styled, { theme } from 'Styled'

/**
 * ButtonTooltip component.
 */
const ButtonTooltip = styled(Tooltip)`
  border-right: 1px solid ${theme('channel.lightBorder')};
  flex: 1;

  &:last-child {
    border-right: 0;
  }

  & > .${Classes.POPOVER_TARGET} {
    width: 100%;

    & > button.${Classes.BUTTON} {
      border-radius: 0;
      width: 100%;
    }
  }
`

/**
 * ChannelDetailsButton Component.
 */
export default class ChannelDetailsButton extends React.Component<Props> {
  /**
   * Renders the component.
   * @return Element to render.
   */
  public render() {
    const { buttonProps, panel, tooltip, type } = this.props

    if (!_.isNil(panel) && !_.isNil(type)) {
      return (
        <ButtonTooltip content={type} position={Position.TOP}>
          <Button icon={panel.icon} onClick={this.onClick} />
        </ButtonTooltip>
      )
    } else if (!_.isNil(tooltip)) {
      return (
        <ButtonTooltip content={tooltip} position={Position.TOP}>
          <Button onClick={this.props.onClick} {...buttonProps} />
        </ButtonTooltip>
      )
    }

    return null
  }

  /**
   * Triggered when the button is clicked.
   */
  private onClick = () => {
    const { onClickPanel, type } = this.props

    if (!_.isNil(onClickPanel) && !_.isNil(type)) {
      onClickPanel(type)
    }
  }
}

/**
 * React Props.
 */
interface Props {
  buttonProps?: IButtonProps
  onClick?: () => void
  onClickPanel?: (type: ChannelDetailsType) => void
  panel?: ChannelDetailsPanel
  tooltip?: JSX.Element | string
  type?: ChannelDetailsType
}

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormControl, Button, Tip } from 'modules/common/components';
import { StageItemContainer } from '../styles';

const propTypes = {
  stage: PropTypes.object,
  remove: PropTypes.func,
  onChangeName: PropTypes.func,
  onKeyPress: PropTypes.func
};

class StageItem extends Component {
  render() {
    const { stage, onChangeName, onKeyPress, remove } = this.props;

    return (
      <StageItemContainer key={stage._id}>
        <FormControl
          defaultValue={stage.name}
          type="text"
          placeholder="Stage name"
          onKeyPress={onKeyPress}
          autoFocus
          onChange={onChangeName.bind(this, stage._id)}
        />

        <Tip text="Delete">
          <Button
            btnStyle="link"
            onClick={remove.bind(this, stage._id)}
            icon="close"
          />
        </Tip>
      </StageItemContainer>
    );
  }
}

StageItem.propTypes = propTypes;

export default StageItem;
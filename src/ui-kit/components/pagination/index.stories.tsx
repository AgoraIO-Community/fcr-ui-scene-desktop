import React, { useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { HalfRoundedPagination, Pagination } from '.';

const meta: ComponentMeta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  args: {
    total: 10,
  },
};

export const Docs: ComponentStory<typeof Pagination> = (props) => {
  const [current, setCurrent] = useState(1);
  const handleChange = (val: number) => {
    setCurrent(val);
  };
  return (
    <div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <Pagination {...props} current={current} onChange={handleChange} />
      </div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <HalfRoundedPagination {...props} current={current} onChange={handleChange} />
      </div>
    </div>
  );
};

export default meta;

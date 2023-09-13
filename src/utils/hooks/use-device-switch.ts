import { AgoraRteMediaPublishState } from 'agora-rte-sdk';
import { EduStreamUI } from '../stream/struct';
import { useStore } from './use-store';
import { SvgIconEnum } from '@components/svg-img';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import {
  CustomMessageCommandType,
  CustomMessageDeviceState,
  CustomMessageDeviceType,
} from '@ui-scene/uistores/type';
import { useI18n } from 'agora-common-libs';
import { EduRoleTypeEnum } from 'agora-edu-core';
const colors = themeVal('colors');
export const checkCameraEnabled = (stream?: EduStreamUI) => {
  return stream?.isVideoDeviceEnabled && stream.isVideoStreamPublished;
};
export const checkMicEnabled = (stream?: EduStreamUI) => {
  return stream?.isMicDeviceEnabled && stream.isMicStreamPublished;
};
export const useDeviceSwitch = ({
  stream,
  isLocal,
}: {
  stream?: EduStreamUI;
  isLocal: boolean;
}) => {
  const {
    layoutUIStore: { addDialog },
    deviceSettingUIStore: {
      isCameraDeviceEnabled,
      isAudioRecordingDeviceEnabled,
      enableCamera,
      enableAudioRecording,
    },
    classroomStore: {
      streamStore: { updateRemotePublishState },
      roomStore: { sendCustomPeerMessage },
    },
  } = useStore();
  const transI18n = useI18n();
  const micEnabled = isLocal ? isAudioRecordingDeviceEnabled : checkMicEnabled(stream);

  const cameraEnabled = isLocal ? isCameraDeviceEnabled : checkCameraEnabled(stream);
  const toggleLocalCameraDevice = async () => {
    if (isCameraDeviceEnabled) {
      enableCamera(false);
    } else {
      if (stream?.isVideoStreamPublished) {
        enableCamera(true);
      } else {
        if (isLocal && stream?.role === EduRoleTypeEnum.teacher) {
          enableCamera(true);
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            videoState: AgoraRteMediaPublishState.Published,
          });
        } else {
          addDialog('confirm', {
            title: transI18n('fcr_user_tips_capture_screen_permission_title'),
            content: transI18n('fcr_user_tips_banned_video_content'),
            cancelButtonVisible: false,
            okButtonProps: {
              styleType: 'danger',
            },
          });
        }
      }
    }
  };
  const toggleLocalAudioRecordingDevice = async () => {
    if (isAudioRecordingDeviceEnabled) {
      enableAudioRecording(false);
    } else {
      if (stream?.isMicStreamPublished) {
        enableAudioRecording(true);
      } else {
        if (isLocal && stream?.role === EduRoleTypeEnum.teacher) {
          enableAudioRecording(true);
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            audioState: AgoraRteMediaPublishState.Published,
          });
        } else {
          addDialog('confirm', {
            title: transI18n('fcr_user_tips_capture_screen_permission_title'),
            content: transI18n('fcr_user_tips_muted_content'),
            cancelButtonVisible: false,
            okButtonProps: {
              styleType: 'danger',
            },
          });
        }
      }
    }
  };
  const localCameraTooltip = cameraEnabled
    ? transI18n('fcr_device_tips_stop_video')
    : transI18n('fcr_device_tips_start_video');
  const remoteCameraTooltip = cameraEnabled
    ? transI18n('fcr_device_tips_stop_video')
    : transI18n('fcr_participants_tips_start_video');
  const cameraTooltip = isLocal ? localCameraTooltip : remoteCameraTooltip;
  const handleCameraClick = () => {
    if (isLocal) {
      toggleLocalCameraDevice();
    } else {
      if (stream) {
        if (cameraEnabled) {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            videoState: AgoraRteMediaPublishState.Unpublished,
          });
        } else {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            videoState: AgoraRteMediaPublishState.Published,
          });
          sendCustomPeerMessage(
            {
              cmd: CustomMessageCommandType.deviceSwitch,
              data: {
                deviceType: CustomMessageDeviceType.camera,
                deviceState: CustomMessageDeviceState.open,
              },
            },
            stream.fromUser.userUuid,
          );
        }
      }
    }
  };
  const localMicTooltip = micEnabled
    ? transI18n('fcr_device_tips_mute')
    : transI18n('fcr_device_tips_unmute');
  const remoteMicTooltip = micEnabled
    ? transI18n('fcr_participants_tips_mute')
    : transI18n('fcr_device_tips_unmute');
  const micTooltip = isLocal ? localMicTooltip : remoteMicTooltip;
  const handleMicrophoneClick = () => {
    if (isLocal) {
      toggleLocalAudioRecordingDevice();
    } else {
      if (stream) {
        if (micEnabled) {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            audioState: AgoraRteMediaPublishState.Unpublished,
          });
        } else {
          updateRemotePublishState(stream.fromUser.userUuid, stream.stream.streamUuid, {
            audioState: AgoraRteMediaPublishState.Published,
          });

          sendCustomPeerMessage(
            {
              cmd: CustomMessageCommandType.deviceSwitch,
              data: {
                deviceType: CustomMessageDeviceType.mic,
                deviceState: CustomMessageDeviceState.open, // 0.close, 1.open
              },
            },
            stream.fromUser.userUuid,
          );
        }
      }
    }
  };
  const cameraIcon = cameraEnabled ? SvgIconEnum.FCR_CAMERA : SvgIconEnum.FCR_CAMERAOFF;
  const cameraIconColor = cameraEnabled ? {} : { iconSecondary: colors['red']['6'] };
  const micIcon = micEnabled ? SvgIconEnum.FCR_MUTE : SvgIconEnum.FCR_NOMUTE;
  const micIconColor = micEnabled ? {} : { iconSecondary: colors['red']['6'] };
  return {
    micIcon,
    micIconColor,
    cameraIcon,
    cameraIconColor,
    cameraTooltip,
    micTooltip,
    micEnabled,
    cameraEnabled,
    handleCameraClick,
    handleMicrophoneClick,
    toggleLocalAudioRecordingDevice,
    toggleLocalCameraDevice,
  };
};

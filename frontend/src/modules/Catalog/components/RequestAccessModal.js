import SendIcon from '@mui/icons-material/Send';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  CardContent,
  CircularProgress,
  Dialog,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Defaults } from 'design';
import { SET_ERROR, useDispatch } from 'globalErrors';
import {
  createShareObject,
  listEnvironmentConsumptionRoles,
  listEnvironmentGroups,
  listValidEnvironments,
  requestDashboardShare,
  useClient
} from 'services';
import { useNavigate } from 'react-router-dom';

export const RequestAccessModal = (props) => {
  const { hit, onApply, onClose, open, stopLoader, ...other } = props;
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const client = useClient();
  const [environmentOptions, setEnvironmentOptions] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingEnvs, setLoadingEnvs] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);

  const fetchEnvironments = useCallback(async () => {
    setLoadingEnvs(true);
    try {
      const response = await client.query(
        listValidEnvironments({
          filter: Defaults.selectListFilter
        })
      );
      if (!response.errors) {
        setEnvironmentOptions(
          response.data.listValidEnvironments.nodes.map((e) => ({
            ...e,
            value: e.environmentUri,
            label: e.label
          }))
        );
      } else {
        dispatch({ type: SET_ERROR, error: response.errors[0].message });
      }
    } catch (e) {
      dispatch({ type: SET_ERROR, error: e.message });
    } finally {
      setLoadingEnvs(false);
      stopLoader();
    }
  }, [client, dispatch]);

  const fetchGroups = async (environmentUri) => {
    setLoadingGroups(true);
    try {
      const response = await client.query(
        listEnvironmentGroups({
          filter: Defaults.selectListFilter,
          environmentUri
        })
      );
      if (!response.errors) {
        setGroupOptions(
          response.data.listEnvironmentGroups.nodes.map((g) => ({
            value: g.groupUri,
            label: g.groupUri
          }))
        );
      } else {
        dispatch({ type: SET_ERROR, error: response.errors[0].message });
      }
    } catch (e) {
      dispatch({ type: SET_ERROR, error: e.message });
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchRoles = async (environmentUri, groupUri) => {
    setLoadingRoles(true);
    try {
      const response = await client.query(
        listEnvironmentConsumptionRoles({
          filter: { ...Defaults.selectListFilter, groupUri: groupUri },
          environmentUri
        })
      );
      if (!response.errors) {
        setRoleOptions(
          response.data.listEnvironmentConsumptionRoles.nodes.map((g) => ({
            value: g.consumptionRoleUri,
            label: [g.consumptionRoleName, ' [', g.IAMRoleArn, ']'].join(''),
            dataallManaged: g.dataallManaged,
            isSharePolicyAttached: g.managedPolicies.find(
              (policy) => policy.policy_type === 'SharePolicy'
            ).attached,
            policyName: g.managedPolicies.find(
              (policy) => policy.policy_type === 'SharePolicy'
            ).policy_name
          }))
        );
      } else {
        dispatch({ type: SET_ERROR, error: response.errors[0].message });
      }
    } catch (e) {
      dispatch({ type: SET_ERROR, error: e.message });
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (client && open) {
      fetchEnvironments().catch((e) =>
        dispatch({ type: SET_ERROR, error: e.message })
      );
    }
  }, [client, open, fetchEnvironments, dispatch]);

  async function submit(values, setStatus, setSubmitting, setErrors) {
    try {
      let response;
      let type = values.consumptionRole ? 'ConsumptionRole' : 'Group';
      let principal = values.consumptionRole
        ? values.consumptionRole
        : values.groupUri;
      if (hit.resourceKind === 'dataset') {
        response = await client.mutate(
          createShareObject({
            datasetUri: hit._id,
            input: {
              environmentUri: values.environment.environmentUri,
              groupUri: values.groupUri,
              principalId: principal,
              principalType: type,
              requestPurpose: values.comment,
              attachMissingPolicies: values.attachMissingPolicies
            }
          })
        );
      }
      if (hit.resourceKind === 'table') {
        response = await client.mutate(
          createShareObject({
            datasetUri: hit.datasetUri,
            itemUri: hit._id,
            itemType: 'DatasetTable',
            input: {
              environmentUri: values.environment.environmentUri,
              groupUri: values.groupUri,
              principalId: principal,
              principalType: type,
              requestPurpose: values.comment,
              attachMissingPolicies: values.attachMissingPolicies
            }
          })
        );
      }
      if (hit.resourceKind === 'folder') {
        response = await client.mutate(
          createShareObject({
            datasetUri: hit.datasetUri,
            itemUri: hit._id,
            itemType: 'DatasetStorageLocation',
            input: {
              environmentUri: values.environment.environmentUri,
              groupUri: values.groupUri,
              principalId: principal,
              principalType: type,
              requestPurpose: values.comment,
              attachMissingPolicies: values.attachMissingPolicies
            }
          })
        );
      }
      if (hit.resourceKind === 'dashboard') {
        response = await client.mutate(
          requestDashboardShare(hit._id, values.groupUri)
        );
      }
      if (response && !response.errors) {
        setStatus({ success: true });
        setSubmitting(false);
        enqueueSnackbar('Draft share request created', {
          anchorOrigin: {
            horizontal: 'right',
            vertical: 'top'
          },
          variant: 'success'
        });
        if (onApply) {
          onApply();
        }
        navigate(`/console/shares/${response.data.createShareObject.shareUri}`);
      } else {
        dispatch({ type: SET_ERROR, error: response.errors[0].message });
      }
    } catch (err) {
      console.error(err);
      setStatus({ success: false });
      setErrors({ submit: err.message });
      setSubmitting(false);
      dispatch({ type: SET_ERROR, error: err.message });
    }
  }

  if (!hit || loadingEnvs) {
    return null;
  }

  return (
    <Dialog maxWidth="md" fullWidth onClose={onClose} open={open} {...other}>
      <Box sx={{ p: 3 }}>
        <Typography
          align="center"
          color="textPrimary"
          gutterBottom
          variant="h4"
        >
          Request Access
        </Typography>
        <Typography align="center" color="textSecondary" variant="subtitle2">
          Data access is requested for the whole requester Team or for the
          selected Consumption role. The request will be submitted to the data
          owners, track its progress in the Shares menu on the left.
        </Typography>
        <Box sx={{ p: 3 }}>
          <Formik
            initialValues={{
              environment: '',
              comment: '',
              attachMissingPolicies: false
            }}
            validationSchema={Yup.object().shape({
              environment: Yup.object().required('*Environment is required'),
              groupUri: Yup.string().required('*Team is required'),
              consumptionRole: Yup.string(),
              comment: Yup.string().max(5000)
            })}
            onSubmit={async (
              values,
              { setErrors, setStatus, setSubmitting }
            ) => {
              await submit(values, setStatus, setSubmitting, setErrors);
            }}
          >
            {({
              errors,
              handleBlur,
              handleChange,
              handleSubmit,
              isSubmitting,
              setFieldValue,
              touched,
              values
            }) => (
              <form onSubmit={handleSubmit}>
                <Box>
                  <CardContent>
                    {hit.resourceKind === 'table' && (
                      <TextField
                        fullWidth
                        disabled
                        label="Table name"
                        name="table"
                        value={hit.label}
                        variant="outlined"
                      />
                    )}
                    {hit.resourceKind === 'folder' && (
                      <TextField
                        fullWidth
                        disabled
                        label="Folder name"
                        name="folder"
                        value={hit.label}
                        variant="outlined"
                      />
                    )}
                    {hit.resourceKind === 'dataset' && (
                      <TextField
                        fullWidth
                        disabled
                        label="Dataset name"
                        name="dataset"
                        value={hit.label}
                        variant="outlined"
                      />
                    )}
                    {hit.resourceKind === 'dashboard' && (
                      <TextField
                        fullWidth
                        disabled
                        label="Dashboard name"
                        name="dashboard"
                        value={hit.label}
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                  {hit.resourceKind !== 'dashboard' && (
                    <Box>
                      <CardContent>
                        <TextField
                          fullWidth
                          error={Boolean(
                            touched.environment && errors.environment
                          )}
                          helperText={touched.environment && errors.environment}
                          label="Environment"
                          name="environment"
                          onChange={(event) => {
                            setFieldValue('groupUri', '');
                            setFieldValue('consumptionRole', '');
                            fetchGroups(
                              event.target.value.environmentUri
                            ).catch((e) =>
                              dispatch({ type: SET_ERROR, error: e.message })
                            );
                            setFieldValue('environment', event.target.value);
                          }}
                          select
                          value={values.environment}
                          variant="outlined"
                        >
                          {environmentOptions.map((environment) => (
                            <MenuItem
                              key={environment.environmentUri}
                              value={environment}
                            >
                              {environment.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </CardContent>
                      <CardContent>
                        {loadingGroups ? (
                          <CircularProgress size={10} />
                        ) : (
                          <Box>
                            {groupOptions.length > 0 ? (
                              <TextField
                                error={Boolean(
                                  touched.groupUri && errors.groupUri
                                )}
                                helperText={touched.groupUri && errors.groupUri}
                                fullWidth
                                label="Requesters Team"
                                name="groupUri"
                                onChange={(event) => {
                                  setFieldValue('consumptionRole', '');
                                  fetchRoles(
                                    values.environment.environmentUri,
                                    event.target.value
                                  ).catch((e) =>
                                    dispatch({
                                      type: SET_ERROR,
                                      error: e.message
                                    })
                                  );
                                  setFieldValue('groupUri', event.target.value);
                                }}
                                select
                                value={values.groupUri}
                                variant="outlined"
                              >
                                {groupOptions.map((group) => (
                                  <MenuItem
                                    key={group.value}
                                    value={group.value}
                                  >
                                    {group.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            ) : (
                              <TextField
                                error={Boolean(
                                  touched.groupUri && errors.groupUri
                                )}
                                helperText={touched.groupUri && errors.groupUri}
                                fullWidth
                                disabled
                                label="Team"
                                value="No teams found for this environment"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        )}
                      </CardContent>
                      <CardContent>
                        {loadingRoles ? (
                          <CircularProgress size={10} />
                        ) : (
                          <Box>
                            {roleOptions.length > 0 ? (
                              <TextField
                                error={Boolean(
                                  touched.consumptionRole &&
                                    errors.consumptionRole
                                )}
                                helperText={
                                  touched.consumptionRole &&
                                  errors.consumptionRole
                                }
                                fullWidth
                                label="Consumption Role (optional)"
                                name="consumptionRole"
                                onChange={(event) => {
                                  setFieldValue(
                                    'consumptionRole',
                                    event.target.value.value
                                  );
                                  setFieldValue(
                                    'consumptionRoleObj',
                                    event.target.value
                                  );
                                }}
                                select
                                value={values.consumptionRoleObj}
                                variant="outlined"
                              >
                                {roleOptions.map((role) => (
                                  <MenuItem key={role.value} value={role}>
                                    {role.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            ) : (
                              <TextField
                                error={Boolean(
                                  touched.consumptionRole &&
                                    errors.consumptionRole
                                )}
                                helperText={
                                  touched.consumptionRole &&
                                  errors.consumptionRole
                                }
                                fullWidth
                                disabled
                                label="Consumption Role (optional)"
                                value="No additional consumption roles owned by this Team in this Environment."
                                variant="outlined"
                              />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Box>
                  )}

                  {!values.consumptionRole ||
                  values.consumptionRoleObj.dataallManaged ||
                  values.consumptionRoleObj.isSharePolicyAttached ? (
                    <Box />
                  ) : (
                    <CardContent sx={{ ml: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.attachMissingPolicies}
                            onChange={handleChange}
                            color="primary"
                            edge="start"
                            name="attachMissingPolicies"
                          />
                        }
                        label={
                          <div>
                            Let Data.All attach policies to this role
                            <Typography
                              color="textSecondary"
                              component="p"
                              variant="caption"
                            ></Typography>
                            {values.consumptionRoleObj &&
                            !(
                              values.consumptionRoleObj.dataallManaged ||
                              values.consumptionRoleObj.isSharePolicyAttached ||
                              values.attachMissingPolicies
                            ) ? (
                              <FormHelperText error>
                                Selected consumption role is managed by
                                customer, but the share policy{' '}
                                <strong>
                                  {values.consumptionRoleObj.policyName}
                                </strong>{' '}
                                is not attached.
                                <br />
                                Please attach it or let Data.all attach it for
                                you.
                              </FormHelperText>
                            ) : (
                              ''
                            )}
                          </div>
                        }
                      />
                    </CardContent>
                  )}
                  <CardContent>
                    <TextField
                      FormHelperTextProps={{
                        sx: {
                          textAlign: 'right',
                          mr: 0
                        }
                      }}
                      fullWidth
                      helperText={`${
                        200 - values.comment.length
                      } characters left`}
                      label="Request purpose"
                      name="comment"
                      multiline
                      onBlur={handleBlur}
                      onChange={handleChange}
                      rows={5}
                      value={values.comment}
                      variant="outlined"
                    />
                    {touched.comment && errors.comment && (
                      <Box sx={{ mt: 2 }}>
                        <FormHelperText error>{errors.comment}</FormHelperText>
                      </Box>
                    )}
                  </CardContent>
                </Box>
                <CardContent>
                  <LoadingButton
                    fullWidth
                    startIcon={<SendIcon fontSize="small" />}
                    color="primary"
                    disabled={
                      isSubmitting ||
                      (values.consumptionRoleObj &&
                        !(
                          values.consumptionRoleObj.dataallManaged ||
                          values.consumptionRoleObj.isSharePolicyAttached ||
                          values.attachMissingPolicies
                        ))
                    }
                    type="submit"
                    variant="contained"
                  >
                    Send Request
                  </LoadingButton>
                </CardContent>
              </form>
            )}
          </Formik>
        </Box>
      </Box>
    </Dialog>
  );
};

RequestAccessModal.propTypes = {
  hit: PropTypes.object.isRequired,
  onApply: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
  stopLoader: PropTypes.func
};
